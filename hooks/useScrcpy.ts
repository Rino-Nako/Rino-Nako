import { useEffect, useRef, useState, useCallback } from 'react';
import { WebADB } from '@/lib/device/adb';
import { AdbScrcpyClient } from '@yume-chan/adb-scrcpy';
import {
  WebCodecsVideoDecoder,
  WebGLVideoFrameRenderer
} from '@yume-chan/scrcpy-decoder-webcodecs';
import {
  ScrcpyVideoCodecId,
  AndroidKeyEventAction,
  AndroidKeyEventMeta,
  AndroidKeyCode,
  AndroidMotionEventAction,
  AndroidMotionEventButton
} from '@yume-chan/scrcpy';

export function useScrcpy() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<string>('Disconnected');
  const [deviceModel, setDeviceModel] = useState<string>('');
  const [videoSize, setVideoSize] = useState<{ width: number; height: number } | null>(null);
  const [displaySize, setDisplaySize] = useState<{ width: number; height: number } | null>(null);
  const [displayInsets, setDisplayInsets] = useState<{ left: number; top: number; right: number; bottom: number } | null>(null);
  const clientRef = useRef<AdbScrcpyClient<any> | null>(null);
  const controllerRef = useRef<ReturnType<any> | null>(null as any);
  const adbRef = useRef<any | null>(null);
  const videoSizeRef = useRef<{ width: number; height: number } | null>(null);

  const connect = useCallback(async () => {
    try {
      setStatus('Connecting to ADB...');
      const webadb = WebADB.getInstance();
      const device = await webadb.connect();
      if (typeof window !== 'undefined' && device?.adb) {
        (window as any).adb = device.adb;
        adbRef.current = device.adb;
        (window as any).adbShell = async (cmd: string) => {
          // Simple shell argument parser that respects quotes
          const parts = cmd.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g)?.map(s => 
            s.startsWith('"') && s.endsWith('"') ? s.slice(1, -1) :
            s.startsWith("'") && s.endsWith("'") ? s.slice(1, -1) : s
          ) || [];
          
          if (parts.length === 0) return "";
          
          try {
            const output = await device.adb.subprocess.noneProtocol.spawnWaitText(parts);
            console.log(output);
            return output;
          } catch (e: any) {
             console.error("adbShell error:", e);
             return "Error: " + e.message;
          }
        };
      }
      
      if (!device) {
        setStatus('Connection cancelled or failed');
        return;
      }

      if (device.model) {
        setDeviceModel(device.model);
      }

      setStatus('Connected to ADB. Starting Scrcpy...');
      
      const client = await webadb.startScrcpy(device.adb);
      clientRef.current = client;

      if (client.videoStream && canvasRef.current) {
        setStatus('Scrcpy started. Initializing decoder...');
        const videoStream = await client.videoStream;
        
        // Force preserveDrawingBuffer to allow screenshots
        try {
           const gl = canvasRef.current.getContext('webgl', { preserveDrawingBuffer: true }) || 
                      canvasRef.current.getContext('experimental-webgl', { preserveDrawingBuffer: true });
           if (!gl) {
             console.warn('Failed to initialize WebGL context with preserveDrawingBuffer: true');
           }
        } catch (e) {
           console.error('Error initializing WebGL context:', e);
        }

        const renderer = new WebGLVideoFrameRenderer(canvasRef.current);
        const decoder = new WebCodecsVideoDecoder({
          codec: ScrcpyVideoCodecId.H264,
          renderer,
        });

        videoStream.sizeChanged(({ width, height }: { width: number; height: number }) => {
          const canvas = canvasRef.current!;
          canvas.width = width;
          canvas.height = height;
          videoSizeRef.current = { width, height };
          setVideoSize({ width, height });
        });

        videoStream.stream.pipeTo(decoder.writable).catch((e: any) => {
          console.error('Video stream error:', e);
          setStatus(`Video stream error: ${e.message}`);
        });

        if (client.controller) {
          controllerRef.current = client.controller;
          if (typeof window !== 'undefined') {
            (window as any).scrcpyController = client.controller;
          }
        }

        try {
          const wmSizeOutput = await device.adb.subprocess.noneProtocol.spawnWaitText(['sh', '-c', 'wm size']);
          const overrideMatch = wmSizeOutput.match(/Override size:\s*(\d+)\s*x\s*(\d+)/i);
          const physicalMatch = wmSizeOutput.match(/Physical size:\s*(\d+)\s*x\s*(\d+)/i);
          const match = overrideMatch || physicalMatch;
          if (match) {
            const width = Number.parseInt(match[1]!, 10);
            const height = Number.parseInt(match[2]!, 10);
            if (width > 0 && height > 0) {
              setDisplaySize({ width, height });
            }
          }
        } catch (e) {
          console.warn('[SoM] Failed to read display size (wm size):', e);
        }

        setIsConnected(true);
        setStatus('Mirroring active');
      }

    } catch (e: any) {
      console.error('Connection failed:', e);
      setStatus(`Error: ${e.message}`);
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    const adb = adbRef.current;
    if (!adb) return;
    if (!videoSize?.width || !videoSize?.height) return;

    let cancelled = false;
    (async () => {
      try {
        const output = await adb.subprocess.noneProtocol.spawnWaitText(['sh', '-c', 'dumpsys window displays 2>&1']);
        const unrestricted = output.match(/mUnrestricted=Rect\((\d+),\s*(\d+)\s*-\s*(\d+),\s*(\d+)\)/);
        const stable = output.match(/mStable=Rect\((\d+),\s*(\d+)\s*-\s*(\d+),\s*(\d+)\)/);
        if (!unrestricted || !stable) return;

        const uLeft = Number.parseInt(unrestricted[1]!, 10);
        const uTop = Number.parseInt(unrestricted[2]!, 10);
        const uRight = Number.parseInt(unrestricted[3]!, 10);
        const uBottom = Number.parseInt(unrestricted[4]!, 10);

        const sLeft = Number.parseInt(stable[1]!, 10);
        const sTop = Number.parseInt(stable[2]!, 10);
        const sRight = Number.parseInt(stable[3]!, 10);
        const sBottom = Number.parseInt(stable[4]!, 10);

        const realW = uRight - uLeft;
        const realH = uBottom - uTop;
        if (realW <= 0 || realH <= 0) return;

        const insetLeft = sLeft - uLeft;
        const insetTop = sTop - uTop;
        const insetRight = uRight - sRight;
        const insetBottom = uBottom - sBottom;

        const scaleX = videoSize.width / realW;
        const scaleY = videoSize.height / realH;

        const scaledInsets = {
          left: Math.round(insetLeft * scaleX),
          top: Math.round(insetTop * scaleY),
          right: Math.round(insetRight * scaleX),
          bottom: Math.round(insetBottom * scaleY),
        };

        if (!cancelled) setDisplayInsets(scaledInsets);
      } catch (e) {
        console.warn('[SoM] Failed to read display insets (dumpsys window displays):', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [videoSize?.width, videoSize?.height]);

  const mapToVideo = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const size = videoSizeRef.current ?? { width: rect.width, height: rect.height };
    const x = Math.max(0, Math.min(size.width - 1, Math.round((e.clientX - rect.left) * size.width / rect.width)));
    const y = Math.max(0, Math.min(size.height - 1, Math.round((e.clientY - rect.top) * size.height / rect.height)));
    return { x, y, vw: size.width, vh: size.height };
  }, []);

  const onPointerDown = useCallback(async (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!controllerRef.current) return;
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    const { x, y, vw, vh } = mapToVideo(e);
    const actionButton = e.button === 0 ? AndroidMotionEventButton.Primary : AndroidMotionEventButton.Secondary;
    const buttons = e.buttons & 1 ? AndroidMotionEventButton.Primary : AndroidMotionEventButton.None;
    try {
      await controllerRef.current.injectTouch({
        action: AndroidMotionEventAction.Down,
        pointerId: BigInt(e.pointerId),
        pointerX: x,
        pointerY: y,
        videoWidth: vw,
        videoHeight: vh,
        pressure: e.pressure || 1,
        actionButton,
        buttons,
      });
    } catch (err) {
      console.error('injectTouch down error', err);
    }
  }, [mapToVideo]);

  const onPointerMove = useCallback(async (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!controllerRef.current) return;
    const { x, y, vw, vh } = mapToVideo(e);
    const buttons = e.buttons & 1 ? AndroidMotionEventButton.Primary : AndroidMotionEventButton.None;
    try {
      await controllerRef.current.injectTouch({
        action: AndroidMotionEventAction.Move,
        pointerId: BigInt(e.pointerId),
        pointerX: x,
        pointerY: y,
        videoWidth: vw,
        videoHeight: vh,
        pressure: e.pressure || (buttons ? 1 : 0),
        actionButton: 0,
        buttons,
      });
    } catch (err) {
      console.error('injectTouch move error', err);
    }
  }, [mapToVideo]);

  const onPointerUp = useCallback(async (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!controllerRef.current) return;
    const { x, y, vw, vh } = mapToVideo(e);
    const actionButton = e.button === 0 ? AndroidMotionEventButton.Primary : AndroidMotionEventButton.Secondary;
    try {
      await controllerRef.current.injectTouch({
        action: AndroidMotionEventAction.Up,
        pointerId: BigInt(e.pointerId),
        pointerX: x,
        pointerY: y,
        videoWidth: vw,
        videoHeight: vh,
        pressure: 0,
        actionButton,
        buttons: AndroidMotionEventButton.None,
      });
    } catch (err) {
      console.error('injectTouch up error', err);
    }
    (e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId);
  }, [mapToVideo]);

  const onWheel = useCallback(async (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!controllerRef.current) return;
    e.preventDefault();
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const size = videoSizeRef.current ?? { width: rect.width, height: rect.height };
    const x = Math.max(0, Math.min(size.width - 1, Math.round((e.clientX - rect.left) * size.width / rect.width)));
    const y = Math.max(0, Math.min(size.height - 1, Math.round((e.clientY - rect.top) * size.height / rect.height)));
    const scrollX = Math.sign(e.deltaX);
    const scrollY = Math.sign(e.deltaY);
    try {
      await controllerRef.current.injectScroll({
        pointerX: x,
        pointerY: y,
        videoWidth: size.width,
        videoHeight: size.height,
        scrollX,
        scrollY,
      });
    } catch (err) {
      console.error('injectScroll error', err);
    }
  }, []);

  const getMetaState = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    let meta = AndroidKeyEventMeta.None;
    if (e.shiftKey) meta |= AndroidKeyEventMeta.Shift;
    if (e.ctrlKey) meta |= AndroidKeyEventMeta.Ctrl;
    if (e.altKey) meta |= AndroidKeyEventMeta.Alt;
    if (e.metaKey) meta |= AndroidKeyEventMeta.Meta;
    return meta;
  };

  const mapKeyCode = (code: string, key: string): AndroidKeyCode | undefined => {
    const table: Record<string, AndroidKeyCode> = {
      Enter: AndroidKeyCode.Enter,
      Backspace: AndroidKeyCode.Backspace,
      Escape: AndroidKeyCode.Escape,
      Space: AndroidKeyCode.Space,
      Tab: AndroidKeyCode.Tab,
      ArrowUp: AndroidKeyCode.ArrowUp,
      ArrowDown: AndroidKeyCode.ArrowDown,
      ArrowLeft: AndroidKeyCode.ArrowLeft,
      ArrowRight: AndroidKeyCode.ArrowRight,
      Home: AndroidKeyCode.Home,
      End: AndroidKeyCode.End,
      PageUp: AndroidKeyCode.PageUp,
      PageDown: AndroidKeyCode.PageDown,
      Insert: AndroidKeyCode.Insert,
      Delete: AndroidKeyCode.Delete,
      F1: AndroidKeyCode.F1,
      F2: AndroidKeyCode.F2,
      F3: AndroidKeyCode.F3,
      F4: AndroidKeyCode.F4,
      F5: AndroidKeyCode.F5,
      F6: AndroidKeyCode.F6,
      F7: AndroidKeyCode.F7,
      F8: AndroidKeyCode.F8,
      F9: AndroidKeyCode.F9,
      F10: AndroidKeyCode.F10,
      F11: AndroidKeyCode.F11,
      F12: AndroidKeyCode.F12,
      Period: AndroidKeyCode.Period,
      Comma: AndroidKeyCode.Comma,
      Minus: AndroidKeyCode.Minus,
      Equal: AndroidKeyCode.Equal,
      BracketLeft: AndroidKeyCode.BracketLeft,
      BracketRight: AndroidKeyCode.BracketRight,
      Backslash: AndroidKeyCode.Backslash,
      Semicolon: AndroidKeyCode.Semicolon,
      Quote: AndroidKeyCode.Quote,
      Slash: AndroidKeyCode.Slash,
      Backquote: AndroidKeyCode.Backquote,
    };
    if (code.startsWith('Key') && code.length === 4) {
      const ch = code[3];
      const map: Record<string, AndroidKeyCode> = {
        A: AndroidKeyCode.KeyA, B: AndroidKeyCode.KeyB, C: AndroidKeyCode.KeyC, D: AndroidKeyCode.KeyD,
        E: AndroidKeyCode.KeyE, F: AndroidKeyCode.KeyF, G: AndroidKeyCode.KeyG, H: AndroidKeyCode.KeyH,
        I: AndroidKeyCode.KeyI, J: AndroidKeyCode.KeyJ, K: AndroidKeyCode.KeyK, L: AndroidKeyCode.KeyL,
        M: AndroidKeyCode.KeyM, N: AndroidKeyCode.KeyN, O: AndroidKeyCode.KeyO, P: AndroidKeyCode.KeyP,
        Q: AndroidKeyCode.KeyQ, R: AndroidKeyCode.KeyR, S: AndroidKeyCode.KeyS, T: AndroidKeyCode.KeyT,
        U: AndroidKeyCode.KeyU, V: AndroidKeyCode.KeyV, W: AndroidKeyCode.KeyW, X: AndroidKeyCode.KeyX,
        Y: AndroidKeyCode.KeyY, Z: AndroidKeyCode.KeyZ,
      };
      return map[ch];
    }
    if (code.startsWith('Digit') && code.length === 6) {
      const d = code[5];
      const map: Record<string, AndroidKeyCode> = {
        '0': AndroidKeyCode.Digit0, '1': AndroidKeyCode.Digit1, '2': AndroidKeyCode.Digit2, '3': AndroidKeyCode.Digit3,
        '4': AndroidKeyCode.Digit4, '5': AndroidKeyCode.Digit5, '6': AndroidKeyCode.Digit6, '7': AndroidKeyCode.Digit7,
        '8': AndroidKeyCode.Digit8, '9': AndroidKeyCode.Digit9,
      };
      return map[d];
    }
    return table[code] ?? undefined;
  };

  const onKeyDown = useCallback(async (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    if (!controllerRef.current) return;
    const meta = getMetaState(e);
    const code = mapKeyCode(e.code, e.key);
    if (code !== undefined) {
      e.preventDefault();
      try {
        await controllerRef.current.injectKeyCode({
          action: AndroidKeyEventAction.Down,
          keyCode: code,
          repeat: e.repeat ? 1 : 0,
          metaState: meta,
        });
      } catch (err) {
        console.error('injectKeyCode down error', err);
      }
      return;
    }
    // Printable characters: use injectText (handles basic typing)
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      try {
        await controllerRef.current.injectText(e.key);
      } catch (err) {
        console.error('injectText error', err);
      }
    }
  }, []);

  const onKeyUp = useCallback(async (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    if (!controllerRef.current) return;
    const meta = getMetaState(e);
    const code = mapKeyCode(e.code, e.key);
    if (code !== undefined) {
      e.preventDefault();
      try {
        await controllerRef.current.injectKeyCode({
          action: AndroidKeyEventAction.Up,
          keyCode: code,
          repeat: 0,
          metaState: meta,
        });
      } catch (err) {
        console.error('injectKeyCode up error', err);
      }
    }
  }, []);

  const onCompositionEnd = useCallback(async (e: React.CompositionEvent<HTMLCanvasElement>) => {
    if (!controllerRef.current) return;
    const text = e.data;
    if (text) {
      try {
        await controllerRef.current.injectText(text);
      } catch (err) {
        console.error('injectText (IME) error', err);
      }
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (clientRef.current) {
      await clientRef.current.close();
      clientRef.current = null;
    }
    setIsConnected(false);
    setStatus('Disconnected');
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    canvasRef,
    isConnected,
    status,
    deviceModel,
    videoSize,
    displaySize,
    displayInsets,
    connect,
    disconnect,
    adbRef,
    controllerRef,
    getVideoSize: () => videoSizeRef.current,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onWheel,
    onKeyDown,
    onKeyUp,
    onCompositionEnd,
  };
}
