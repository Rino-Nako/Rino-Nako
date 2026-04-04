import { useCallback, useRef, useState, type RefObject } from 'react';
import { InputManager, installAdbKeyboard } from '@/lib/input-manager';
import { DeviceController } from '@/lib/device-control';
import { Adb } from '@yume-chan/adb';
import { GoogleGenAI } from '@google/genai';
import {
  AndroidKeyCode,
  AndroidKeyEventAction,
  AndroidKeyEventMeta,
  AndroidMotionEventAction,
  AndroidMotionEventButton,
} from '@yume-chan/scrcpy';
import { AgentAction, mapCoordinates } from '@/lib/agent-core';
import { compressBase64Image, getScreenshotFromCanvas, stripBase64Prefix } from '@/lib/screenshot-utils';
import { MessageBuilder } from '@/lib/message-builder';
import { parseModelResponse } from '@/lib/response-parser';
import { extractActionParams } from '@/lib/action-extractor';
import { ChatMessage } from '@/types/agent';
import { getSystemPrompt } from '@/lib/prompts';
import { UIElement, getInteractableElements } from '@/lib/som/xml-parser';
import { drawSoMComposite, drawSoMOverlayMask } from '@/lib/som/som-renderer';
import { parseSSE } from '@/lib/sse-parser';

type ScrcpyController = {
  injectTouch: (args: any) => Promise<void>;
  injectKeyCode: (args: any) => Promise<void>;
  injectText: (text: string) => Promise<void>;
};

type OpenAIContentPart =
  | { type: 'text'; text?: string }
  | { type: 'image_url'; image_url?: { url?: string } };

type OpenAIMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string | OpenAIContentPart[];
};

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const extractDataUrl = (url?: string) => {
  if (!url) return null;
  const match = url.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], data: match[2] };
};

const contentToText = (content: string | OpenAIContentPart[]) => {
  if (typeof content === 'string') return content;
  return content
    .map((part) => (part.type === 'text' ? part.text || '' : ''))
    .filter(Boolean)
    .join('');
};

const buildGeminiRequest = (payload: any) => {
  const messages: OpenAIMessage[] = Array.isArray(payload?.messages) ? payload.messages : [];
  const systemText = messages
    .filter((msg) => msg.role === 'system')
    .map((msg) => contentToText(msg.content))
    .filter(Boolean)
    .join('\n');

  const contents = messages
    .filter((msg) => msg.role !== 'system')
    .map((msg) => {
      const parts: any[] = [];
      if (typeof msg.content === 'string') {
        parts.push({ text: msg.content });
      } else {
        for (const part of msg.content) {
          if (part.type === 'text') {
            parts.push({ text: part.text || '' });
          } else if (part.type === 'image_url') {
            const parsed = extractDataUrl(part.image_url?.url);
            if (parsed) {
              parts.push({
                inlineData: {
                  mimeType: parsed.mimeType,
                  data: parsed.data,
                },
              });
            }
          }
        }
      }
      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: parts.length ? parts : [{ text: '' }],
      };
    });

  const config: any = {};
  if (payload?.temperature !== undefined) config.temperature = payload.temperature;
  if (payload?.top_p !== undefined) config.topP = payload.top_p;
  if (payload?.max_tokens !== undefined) config.maxOutputTokens = payload.max_tokens;
  if (Array.isArray(payload?.stop) && payload.stop.length) config.stopSequences = payload.stop;
  if (systemText) config.systemInstruction = { parts: [{ text: systemText }] };

  return { contents, config };
};

const callGeminiDirect = async function* (
  config: { apiKey: string; baseUrl?: string; model?: string },
  payload: any,
  signal: AbortSignal
) {
  const model = payload?.model || config.model || 'gemini-3-flash-preview';
  const { contents, config: requestConfig } = buildGeminiRequest(payload);
  const ai = new GoogleGenAI({ apiKey: config.apiKey });
  if (config.baseUrl) {
    requestConfig.httpOptions = { baseUrl: config.baseUrl.replace(/\/+$/, '') };
  }
  requestConfig.abortSignal = signal;
  const stream = await ai.models.generateContentStream({ model, contents, config: requestConfig });
  for await (const chunk of stream) {
    const text = chunk?.text;
    if (text) yield text;
  }
};

const getControllerFromWindow = (): ScrcpyController | null => {
  if (typeof window === 'undefined') return null;
  return ((window as any).scrcpyController as ScrcpyController | undefined) ?? null;
};

const executeShell = async (cmd: string) => {
  if (typeof window === 'undefined') return;
  const shell = (window as any).adbShell;
  if (shell) {
    await shell(cmd);
  } else {
    throw new Error('ADB Shell not available');
  }
};

const executeAction = async (action: AgentAction, canvas: HTMLCanvasElement, elements?: UIElement[]) => {
  const controller = getControllerFromWindow();
  const videoWidth = canvas.width || Math.round(canvas.getBoundingClientRect().width);
  const videoHeight = canvas.height || Math.round(canvas.getBoundingClientRect().height);

  if (!controller) {
    throw new Error('Scrcpy controller not available');
  }

  if (action.type === 'click' || action.type === 'double_click' || action.type === 'long_press') {
    let x = 0;
    let y = 0;

    // Support ID-based selection (from Independent Mode)
    if (action.params.length === 1 && (typeof action.params[0] === 'string' || typeof action.params[0] === 'number')) {
      const id = Number(action.params[0]);
      const el = elements?.find((e) => e.id === id);
      if (el) {
        x = el.center.x;
        y = el.center.y;
        console.log(`[Agent] Tap ID ${id} -> Device[${x},${y}]`);
      } else {
        console.warn(`[Agent] Element ID ${id} not found!`);
        // If element not found, we can't click.
        // We could throw error, but for now just return to avoid crash with 0,0
        return;
      }
    } else {
      // Traditional Coordinate-based selection
      const [aiX, aiY] = action.params as [number, number];
      const coords = mapCoordinates(Number(aiX), Number(aiY), videoWidth, videoHeight, 1000);
      x = coords.x;
      y = coords.y;
      console.log(`[Agent] Tap: AI[${aiX},${aiY}] -> Device[${x},${y}] (Screen: ${videoWidth}x${videoHeight})`);
    }

    const pointerId = BigInt(1);

    await controller.injectTouch({
      action: AndroidMotionEventAction.Down,
      pointerId,
      pointerX: x,
      pointerY: y,
      videoWidth,
      videoHeight,
      pressure: 1,
      actionButton: AndroidMotionEventButton.Primary,
      buttons: AndroidMotionEventButton.Primary,
    });

    if (action.type === 'double_click') {
      await controller.injectTouch({
        action: AndroidMotionEventAction.Up,
        pointerId,
        pointerX: x,
        pointerY: y,
        videoWidth,
        videoHeight,
        pressure: 0,
        actionButton: AndroidMotionEventButton.Primary,
        buttons: AndroidMotionEventButton.None,
      });
      await sleep(80);
      await controller.injectTouch({
        action: AndroidMotionEventAction.Down,
        pointerId,
        pointerX: x,
        pointerY: y,
        videoWidth,
        videoHeight,
        pressure: 1,
        actionButton: AndroidMotionEventButton.Primary,
        buttons: AndroidMotionEventButton.Primary,
      });
    }

    if (action.type === 'long_press') {
      await sleep(600);
    }

    await controller.injectTouch({
      action: AndroidMotionEventAction.Up,
      pointerId,
      pointerX: x,
      pointerY: y,
      videoWidth,
      videoHeight,
      pressure: 0,
      actionButton: AndroidMotionEventButton.Primary,
      buttons: AndroidMotionEventButton.None,
    });
    return;
  }

  if (action.type === 'swipe') {
    let startX = 0, startY = 0, endX = 0, endY = 0;

    // Support ID-based swipe (Independent Mode): params = [startId, endId]
    if (action.params.length === 2 && elements && elements.length > 0 && 
        (typeof action.params[0] === 'string' || typeof action.params[0] === 'number')) {
      const startId = Number(action.params[0]);
      const endId = Number(action.params[1]);
      const startEl = elements.find(e => e.id === startId);
      const endEl = elements.find(e => e.id === endId);
      
      if (startEl && endEl) {
        startX = startEl.center.x;
        startY = startEl.center.y;
        endX = endEl.center.x;
        endY = endEl.center.y;
        console.log(`[Agent] Swipe IDs ${startId}->${endId} : [${startX},${startY}] -> [${endX},${endY}]`);
      } else {
        console.warn(`[Agent] Swipe IDs ${startId}->${endId} not found. Fallback to center swipe.`);
        // Fallback: Center to Top (Scroll Down)
        startX = videoWidth / 2;
        startY = videoHeight * 0.8;
        endX = videoWidth / 2;
        endY = videoHeight * 0.2;
      }
    } else {
      // Traditional Coordinate-based swipe
      const [sx, sy, ex, ey] = action.params as [number, number, number, number];
      const start = mapCoordinates(Number(sx), Number(sy), videoWidth, videoHeight, 1000);
      const end = mapCoordinates(Number(ex), Number(ey), videoWidth, videoHeight, 1000);
      startX = start.x;
      startY = start.y;
      endX = end.x;
      endY = end.y;
    }

    const pointerId = BigInt(1);

    // Smooth swipe implementation
    const steps = 10;
    const duration = 300; // 300ms swipe
    const stepDelay = duration / steps;

    // 1. Down
    await controller.injectTouch({
      action: AndroidMotionEventAction.Down,
      pointerId,
      pointerX: startX,
      pointerY: startY,
      videoWidth,
      videoHeight,
      pressure: 1,
      actionButton: AndroidMotionEventButton.Primary,
      buttons: AndroidMotionEventButton.Primary,
    });

    // 2. Move (Interpolated)
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      // Linear interpolation
      const x = startX + (endX - startX) * t;
      const y = startY + (endY - startY) * t;

      await sleep(stepDelay);
      
      await controller.injectTouch({
        action: AndroidMotionEventAction.Move,
        pointerId,
        pointerX: x,
        pointerY: y,
        videoWidth,
        videoHeight,
        pressure: 1,
        actionButton: 0,
        buttons: AndroidMotionEventButton.Primary,
      });
    }

    // 3. Up
    await sleep(stepDelay);
    await controller.injectTouch({
      action: AndroidMotionEventAction.Up,
      pointerId,
      pointerX: endX,
      pointerY: endY,
      videoWidth,
      videoHeight,
      pressure: 0,
      actionButton: AndroidMotionEventButton.Primary,
      buttons: AndroidMotionEventButton.None,
    });
    return;
  }

  if (action.type === 'input') {
    const [text] = action.params as [string];
    const str = String(text ?? '');
    console.log(`[Agent] Executing Input: "${str}"`);
    
    // Try to use InputManager (ADB Keyboard) first
    const adb = (window as any).adb as Adb | undefined;
    if (adb) {
      const inputManager = new InputManager(adb);
      try {
        await inputManager.typeText(str);
        return;
      } catch (e: any) {
        if (e.message === "ADB_KEYBOARD_NOT_INSTALLED") {
           console.log("ADB Keyboard not installed, trying to install...");
           try {
             await installAdbKeyboard(adb);
             await inputManager.typeText(str);
             return;
           } catch (installError) {
             console.error("Failed to install ADB Keyboard:", installError);
             // Fallback to scrcpy injection below
           }
        } else {
           console.error("InputManager error:", e);
           // Fallback to scrcpy injection below
        }
      }
    }

    await controller.injectText(str);
    return;
  }

  if (action.type === 'back' || action.type === 'home') {
    const keyCode = action.type === 'back' ? AndroidKeyCode.AndroidBack : AndroidKeyCode.AndroidHome;
    await controller.injectKeyCode({
      action: AndroidKeyEventAction.Down,
      keyCode,
      repeat: 0,
      metaState: AndroidKeyEventMeta.None,
    });
    await controller.injectKeyCode({
      action: AndroidKeyEventAction.Up,
      keyCode,
      repeat: 0,
      metaState: AndroidKeyEventMeta.None,
    });
    return;
  }

  if (action.type === 'wait') {
    const [seconds] = action.params as [number];
    const ms = Math.max(0, Number(seconds ?? 1) * 1000);
    await sleep(ms);
    return;
  }

  if (action.type === 'launch') {
    const [appName] = action.params as [string];
    if (!appName) throw new Error('Missing app name for launch');
    
    const adb = (window as any).adb as Adb | undefined;
    if (adb) {
      const device = new DeviceController(adb);
      await device.launchApp(appName);
    } else {
      // Fallback if adb object is missing but shell might work (legacy path)
      // usage: monkey -p <packagename> -c android.intent.category.LAUNCHER 1
      // Note: This fallback assumes appName IS packageName, which might fail for "微信"
      console.warn('ADB instance missing, falling back to legacy shell execution. This may fail if app name is not a package name.');
      await executeShell(`monkey -p ${appName} -c android.intent.category.LAUNCHER 1`);
    }
    return;
  }

  if (action.type === 'take_over') {
    // Treat take_over as a finish state but with a specific message
    // We don't throw an error, we just return so the loop stops.
    // The calling function handles the return value.
    return;
  }

  if (action.type === 'finish') return;

  throw new Error(`Unsupported action: ${action.type}`);
};

export function useAgentLoop(params: {
  canvasRef: RefObject<HTMLCanvasElement>;
  isConnected: boolean;
  restrictedAppsMode: boolean;
  adbRef?: { current: Adb | null };
  displaySize?: { width: number; height: number } | null;
  displayInsets?: { left: number; top: number; right: number; bottom: number } | null;
}) {
  const { canvasRef, isConnected, restrictedAppsMode, adbRef, displaySize, displayInsets } = params;
  const [isRunning, setIsRunning] = useState(false);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const historyRef = useRef<ChatMessage[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    historyRef.current = [];
    setHistory([]);
    setCurrentPlan(null);
  }, []);

  const stopTask = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const startTask = useCallback(
    async (
      instruction: string, 
      config: { apiKey: string; provider?: string; baseUrl?: string; model?: string }, 
      opts?: { 
        maxSteps?: number; 
        maxTokens?: number;
        temperature?: number;
        frequencyPenalty?: number;
        topP?: number;
        mode?: 'normal' | 'independent';
        som?: {
          enabled?: boolean;
          onPullingChange?: (pulling: boolean) => void;
          onOverlay?: (overlayBase64: string) => void;
        };
        onStep?: (info: { step: number; action: AgentAction }) => void 
      }
    ) => {
      if (!isConnected) {
        throw new Error('Device not connected');
      }
      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error('Canvas not ready');
      }
      if (!config.apiKey) {
        throw new Error('Missing API Key');
      }

      setIsRunning(true);
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      try {
        const maxSteps = opts?.maxSteps ?? 30;
        for (let step = 0; step < maxSteps; step++) {
          if (signal.aborted) throw new Error('Task stopped by user');

          const screenshot = getScreenshotFromCanvas(canvas, 0.8);
          if (screenshot.isSensitive) {
            throw new Error('Screen content is protected (sensitive), cannot proceed.');
          }
          
          // 1. Prepare history (prune old images)
          const cleanHistory = MessageBuilder.pruneHistory(historyRef.current);
          
          // Optimization: Limit history length to prevent context overflow and improve speed
          const MAX_HISTORY_LENGTH = 10;
          const historyToSend = cleanHistory.length > MAX_HISTORY_LENGTH 
            ? cleanHistory.slice(-MAX_HISTORY_LENGTH) 
            : cleanHistory;

          // 2. Build current message
          let frameBase64 = screenshot.base64Data;
          const somEnabled = Boolean(opts?.som?.enabled);
          const device = adbRef?.current ?? null;
          let shouldCompressSoM = false;
          let elements: UIElement[] = [];

          if (somEnabled && device) {
            opts?.som?.onPullingChange?.(true);
            try {
              if (signal.aborted) throw new Error('Task stopped by user');
              const res = await getInteractableElements(
                device,
                { width: canvas.width, height: canvas.height },
                displaySize ?? null
                ,
                displayInsets ?? null
              );
              elements = res;
              
              if (signal.aborted) throw new Error('Task stopped by user');
              const overlayMask = drawSoMOverlayMask(canvas, elements);
              if (overlayMask) {
                opts?.som?.onOverlay?.(overlayMask);
              }

              const compositeBase64 = drawSoMComposite(canvas, elements);
              if (compositeBase64) {
                frameBase64 = compositeBase64;
                shouldCompressSoM = true;
              }
            } catch (e) {
              console.warn('[SoM] Failed to build overlay:', e);
            } finally {
              opts?.som?.onPullingChange?.(false);
            }
          }

          if (shouldCompressSoM) {
            frameBase64 = await compressBase64Image(frameBase64, { quality: 0.6, maxSize: 1280 });
          }

          const base64Data = stripBase64Prefix(frameBase64);
          const currentMsg = MessageBuilder.createUserMessage(
            step === 0 ? instruction : '** Screen Info **',
            base64Data
          );

          const payload = {
            model: config.model || 'autoglm-phone',
            messages: [
              { role: 'system', content: getSystemPrompt(restrictedAppsMode, opts?.mode ?? 'normal') },
              ...historyToSend,
              currentMsg
            ],
            temperature: opts?.temperature ?? 0.1,
            max_tokens: opts?.maxTokens ?? 1024,
            frequency_penalty: opts?.frequencyPenalty ?? 0.2,
            top_p: opts?.topP,
            stream: true,
          };

          if (signal.aborted) throw new Error('Task stopped by user');

          let responseText = '';
          if (config.provider === 'gemini') {
            const stream = callGeminiDirect(config, payload, signal);
            const tempHistory = [...historyRef.current, currentMsg, { role: 'assistant', content: '' } as ChatMessage];
            setHistory(tempHistory);

            let accumulated = '';
            let lastEmitAt = 0;
            const emit = (force = false) => {
              const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
              if (!force && now - lastEmitAt < 33) return;
              lastEmitAt = now;
              const updatedHistory = [...tempHistory];
              updatedHistory[updatedHistory.length - 1] = {
                ...updatedHistory[updatedHistory.length - 1],
                content: accumulated,
              };
              setHistory(updatedHistory);
            };

            for await (const chunk of stream) {
              if (signal.aborted) break;
              accumulated += chunk;
              emit();
            }
            emit(true);
            responseText = accumulated;
          } else {
            const res = await fetch('/api/chat', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json',
                'X-Api-Provider': config.provider || 'zhipu',
                'X-Base-Url': config.baseUrl || '',
              },
              body: JSON.stringify(payload),
              signal,
            });

            if (!res.ok) {
              const errorText = await res.text();
              throw new Error(`API Request Failed: ${res.status} ${errorText}`);
            }

            if (signal.aborted) throw new Error('Task stopped by user');

            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('text/event-stream') && res.body) {
              let accumulated = '';
              const tempHistory = [...historyRef.current, currentMsg, { role: 'assistant', content: '' } as ChatMessage];
              setHistory(tempHistory);
              let lastEmitAt = 0;
              const emit = (force = false) => {
                const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
                if (!force && now - lastEmitAt < 33) return;
                lastEmitAt = now;
                const updatedHistory = [...tempHistory];
                updatedHistory[updatedHistory.length - 1] = {
                  ...updatedHistory[updatedHistory.length - 1],
                  content: accumulated,
                };
                setHistory(updatedHistory);
              };

              for await (const chunk of parseSSE(res.body)) {
                if (signal.aborted) break;
                const delta = chunk.choices?.[0]?.delta?.content;
                if (delta) {
                  accumulated += delta;
                  emit();
                }
              }
              emit(true);
              responseText = accumulated;
            } else {
              const data = await res.json();
              const rawContent = data?.choices?.[0]?.message?.content;
              responseText = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent ?? '');
            }
          }

          const { thinking, plan, action: actionString } = parseModelResponse(responseText);
          if (plan) {
            setCurrentPlan(plan);
          }
          let action: AgentAction = { type: 'error', params: [], thought: thinking, raw: responseText };

          if (actionString.startsWith('finish(message=')) {
            const msg = actionString.replace('finish(message=', '').slice(0, -1);
            action = { type: 'finish', params: [msg], thought: thinking, raw: responseText };
          } else if (actionString.startsWith('do(action=')) {
            const call = extractActionParams(actionString);
            if (call) {
              const type = call.name.toLowerCase();
              if (
                type === 'click' ||
                type === 'double_click' ||
                type === 'long_press' ||
                type === 'swipe' ||
                type === 'input' ||
                type === 'wait' ||
                type === 'back' ||
                type === 'home' ||
                type === 'launch' ||
                type === 'take_over'
              ) {
                action = { type: type as any, params: call.args, thought: thinking, raw: responseText };
              }
            }
          } else {
            action = { type: 'finish', params: [responseText], thought: thinking, raw: responseText };
          }

          opts?.onStep?.({ step, action });

          const nextHistory = [...historyRef.current, currentMsg, { role: 'assistant', content: responseText } as ChatMessage];
          historyRef.current = nextHistory;
          setHistory(nextHistory);

          if (action.type === 'finish') {
            return { finished: true, message: String((action.params as any[])?.[0] ?? '') };
          }

          if (action.type === 'take_over') {
            return { finished: true, message: 'AI requested manual takeover (Take_over)' };
          }

          if (signal.aborted) throw new Error('Task stopped by user');

          if (action.type !== 'error') {
             await executeAction(action, canvas, elements);
          }
          
          if (signal.aborted) throw new Error('Task stopped by user');

          await sleep(100);
        }

        return { finished: false, message: 'Max steps reached' };
      } finally {
        setIsRunning(false);
        abortControllerRef.current = null;
      }
    },
    [canvasRef, isConnected, restrictedAppsMode, adbRef, displaySize, displayInsets]
  );

  return { startTask, stopTask, isRunning, history, reset, currentPlan };
}
