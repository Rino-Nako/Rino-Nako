import React, { useRef, useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '@/types';
import SettingsModal from '../settings/SettingsModal';
import RawDataModal from '../common/RawDataModal';
import AgentActionWidget from './AgentActionWidget';
import { TaskStep } from './TaskStatus';
import ThoughtProcess from './ThoughtProcess';
import { Adb } from '@yume-chan/adb';
import { AndroidMotionEventAction, AndroidMotionEventButton } from '@yume-chan/scrcpy';
import { 
  Trash2, 
  Copy, 
  ThumbsUp, 
  ThumbsDown, 
  RotateCcw, 
  Paperclip, 
  Sparkles, 
  Bot,
  ChevronDown,
  Check,
  Maximize2,
  Minimize2,
  AppWindow,
  ArrowUp,
  Square,
  PictureInPicture2,
  Smartphone,
  ListChecks,
  LoaderCircle,
  CheckCircle2,
  Circle
} from 'lucide-react';

interface ChatPanelProps {
  messages: Message[];
  input: string;
  isThinking: boolean;
  steps?: TaskStep[];
  onInputChange: (value: string) => void;
  onSend: () => void;
  onStop?: () => void;
  onRestart?: () => void;
  apiKey: string;
  apiProvider?: string;
  baseUrl?: string;
  apiModel?: string;
  onSaveSettings: (settings: { 
    provider: string, 
    key: string, 
    baseUrl?: string, 
    model?: string, 
    restrictedAppsMode: boolean, 
    deepCollabEnabled: boolean,
    nakoCliEnabled: boolean,
    nickname: string,
    maxSteps: number,
    maxTokens: number,
    temperature: number,
    frequencyPenalty: number,
    collabProvider: string,
    collabKey: string,
    collabBaseUrl?: string,
    collabModel?: string,
    multimodalEnabled: boolean,
    deepCollabExecutorMaxSteps: number,
    deepCollabExecutorMaxTokens: number,
    deepCollabExecutorTemperature: number,
    deepCollabExecutorFrequencyPenalty: number,
    deepCollabPlannerMaxTokens: number,
    deepCollabPlannerTemperature: number,
    deepCollabPlannerFrequencyPenalty: number,
    deepCollabPlannerTopP: number,
    independentModeEnabled: boolean,
    independentProvider: string,
    independentKey: string,
    independentBaseUrl?: string,
    independentModel?: string,
    independentMultimodalEnabled: boolean,
    independentMaxTokens: number,
    independentTemperature: number,
    independentFrequencyPenalty: number,
    independentTopP: number,
    somEnabled: boolean
  }) => void;
  onDeleteChat?: () => void;
  onNewChat?: () => void;
  adb?: Adb | null;
  nickname?: string;
  maxSteps?: number;
  maxTokens?: number;
  temperature?: number;
  frequencyPenalty?: number;
  deepCollabEnabled?: boolean;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  isDevicePanelCollapsed?: boolean;
  onToggleDevicePanel?: () => void;

  // Deep Collab Settings
  collabProvider?: string;
  collabKey?: string;
  collabBaseUrl?: string;
  collabModel?: string;
  multimodalEnabled?: boolean;
  deepCollabExecutorMaxSteps?: number;
  deepCollabExecutorMaxTokens?: number;
  deepCollabExecutorTemperature?: number;
  deepCollabExecutorFrequencyPenalty?: number;
  deepCollabPlannerMaxTokens?: number;
  deepCollabPlannerTemperature?: number;
  deepCollabPlannerFrequencyPenalty?: number;
  deepCollabPlannerTopP?: number;
  nakoCliEnabled?: boolean;
  activeAssistantName?: string;
  activeAssistantAvatar?: string;
  isDeepCollabActive?: boolean;
  onToggleDeepCollabActive?: (next: boolean) => void;
  independentModeEnabled?: boolean;
  independentProvider?: string;
  independentKey?: string;
  independentBaseUrl?: string;
  independentModel?: string;
  independentMultimodalEnabled?: boolean;
  independentMaxTokens?: number;
  independentTemperature?: number;
  independentFrequencyPenalty?: number;
  independentTopP?: number;
  somEnabled?: boolean;
  somLoading?: boolean;
  isIndependentActive?: boolean;
  onToggleIndependentActive?: (next: boolean) => void;
  isSettingsOpen: boolean;
  onCloseSettings: () => void;
  pipCanvasRef?: React.RefObject<HTMLCanvasElement>;
  pipChatTitle?: string;
  pipIsConnected?: boolean;
  pipDeviceModel?: string | null;
  currentPlan?: any[];
}

const MarkdownComponents: Components = {
  ul: ({node, ...props}) => <ul className="list-disc pl-5 my-2" {...props} />,
  ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-2" {...props} />,
  h1: ({node, ...props}) => <h1 className="text-2xl font-bold my-4" {...props} />,
  h2: ({node, ...props}) => <h2 className="text-xl font-bold my-3" {...props} />,
  h3: ({node, ...props}) => <h3 className="text-lg font-bold my-2" {...props} />,
  h4: ({node, ...props}) => <h4 className="text-base font-bold my-2" {...props} />,
  p: ({node, ...props}) => <p className="mb-4 last:mb-0" {...props} />,
  a: ({node, ...props}) => <a className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
  blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4 text-gray-600 dark:text-gray-400" {...props} />,
  code: ({node, inline, className, children, ...props}: any) => {
    return inline ? (
      <code className="bg-gray-100 dark:bg-[#2A2A2A] rounded px-1 py-0.5 font-mono text-sm text-gray-800 dark:text-gray-200" {...props}>{children}</code>
    ) : (
      <pre className="bg-gray-100 dark:bg-[#171717] border dark:border-[#2A2A2A] rounded p-3 overflow-x-auto font-mono text-sm my-4 text-gray-800 dark:text-gray-200" {...props}>
        <code>{children}</code>
      </pre>
    );
  },
  table: ({node, ...props}) => <div className="overflow-x-auto my-4"><table className="min-w-full divide-y divide-gray-200 border dark:border-[#2A2A2A]" {...props} /></div>,
  thead: ({node, ...props}) => <thead className="bg-gray-50 dark:bg-[#2A2A2A]" {...props} />,
  tbody: ({node, ...props}) => <tbody className="bg-white dark:bg-[#1E1E1E] divide-y divide-gray-200 dark:divide-[#2A2A2A]" {...props} />,
  tr: ({node, ...props}) => <tr {...props} />,
  th: ({node, ...props}) => <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r last:border-r-0" {...props} />,
  td: ({node, ...props}) => <td className="px-3 py-2 text-sm text-gray-500 border-r last:border-r-0" {...props} />,
};

const cleanContent = (text: string) => {
  return text
    .replace(/(\n\s*)?【执行动作】[\s\S]*?(?=(\n\s*【|$))/g, '')
    .replace(/(\n\s*)?【回复】/g, '')
    .trim();
};

const renderMessageContent = (content: string) => {
  // First, extract raw data if present to hide it from display
  const rawDataMarker = '【原始数据】';
  const rawDataIndex = content.indexOf(rawDataMarker);
  
  let contentToRender = content;
  
  if (rawDataIndex !== -1) {
    // Hide raw data section from the rendered content
    contentToRender = content.slice(0, rawDataIndex).trim();
  }

  const thoughtMarker = '【思考过程】';
  const startIndex = contentToRender.indexOf(thoughtMarker);
  
  if (startIndex === -1) {
    const cleaned = cleanContent(contentToRender);
    return (
      <div className="text-gray-700 dark:text-gray-300 dark:text-gray-600 text-base leading-relaxed">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
          {cleaned}
        </ReactMarkdown>
      </div>
    );
  }

  let thoughtContentStart = startIndex + thoughtMarker.length;
  // Skip optional newline after marker
  if (contentToRender[thoughtContentStart] === '\n') thoughtContentStart++;

  const contentAfter = contentToRender.slice(thoughtContentStart);
  // Find next marker start (e.g. \n\n【 or \n【)
  const nextMarkerMatch = contentAfter.match(/\n\s*【/); 
  
  let thoughtContentEnd = contentAfter.length;
  if (nextMarkerMatch && nextMarkerMatch.index !== undefined) {
    thoughtContentEnd = nextMarkerMatch.index;
  }

  const thoughtText = contentAfter.slice(0, thoughtContentEnd).trim();
  const beforeText = contentToRender.slice(0, startIndex).trim();
  const afterText = contentAfter.slice(thoughtContentEnd).trim();

  const cleanedBefore = cleanContent(beforeText);
  const cleanedAfter = cleanContent(afterText);

  return (
    <div className="w-full space-y-2">
      {cleanedBefore && (
        <div className="text-gray-700 dark:text-gray-300 dark:text-gray-600 text-base leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
            {cleanedBefore}
          </ReactMarkdown>
        </div>
      )}
      
      <ThoughtProcess>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
          {thoughtText}
        </ReactMarkdown>
      </ThoughtProcess>
      
      {cleanedAfter && (
        <div className="text-gray-700 dark:text-gray-300 dark:text-gray-600 text-base leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={MarkdownComponents}>
            {cleanedAfter}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default function ChatPanel({
  messages,
  input,
  isThinking,
  steps = [],
  onInputChange,
  onSend,
  onStop,
  onRestart,
  apiKey,
  apiProvider = 'zhipu',
  baseUrl = '',
  apiModel = '',
  onSaveSettings,
  onDeleteChat,
  onNewChat,
  adb,
  nickname = 'User',
  maxSteps,
  maxTokens,
  temperature,
  frequencyPenalty,
  deepCollabEnabled,
  onToggleSidebar,
  isSidebarOpen = true,
  isDevicePanelCollapsed,
  onToggleDevicePanel,
  collabProvider,
  collabKey,
  collabBaseUrl,
  collabModel,
  multimodalEnabled,
  deepCollabExecutorMaxSteps,
  deepCollabExecutorMaxTokens,
  deepCollabExecutorTemperature,
  deepCollabExecutorFrequencyPenalty,
  deepCollabPlannerMaxTokens,
  deepCollabPlannerTemperature,
  deepCollabPlannerFrequencyPenalty,
  deepCollabPlannerTopP,
  nakoCliEnabled,
  activeAssistantName,
  activeAssistantAvatar,
  isDeepCollabActive = false,
  onToggleDeepCollabActive,
  independentModeEnabled,
  independentProvider,
  independentKey,
  independentBaseUrl,
  independentModel,
  independentMultimodalEnabled,
  independentMaxTokens,
  independentTemperature,
  independentFrequencyPenalty,
  independentTopP,
  somEnabled,
  somLoading,
  isIndependentActive = false,
  onToggleIndependentActive,
  isSettingsOpen,
  onCloseSettings,
  pipCanvasRef,
  pipChatTitle,
  pipIsConnected,
  pipDeviceModel,
  currentPlan,
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('Nako Web');
  const [rawMessageContent, setRawMessageContent] = useState<string | null>(null);
  const [pipMode, setPipMode] = useState<'none' | 'document' | 'overlay'>('none');
  const overlayVideoRef = useRef<HTMLVideoElement>(null);
  const pipStateRef = useRef<{
    win: Window | null;
    stream: MediaStream | null;
    statusEl: HTMLDivElement | null;
    titleEl: HTMLDivElement | null;
    stepEl: HTMLDivElement | null;
    cleanup: (() => void) | null;
  }>({
    win: null,
    stream: null,
    statusEl: null,
    titleEl: null,
    stepEl: null,
    cleanup: null,
  });
  
  // New state for task status UI
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [timer, setTimer] = useState(0);

  // Deep Collab State
  // const [deepCollabEnabled, setDeepCollabEnabled] = useState(false); // Removed internal state
  const toggleDeepCollab = () => onToggleDeepCollabActive?.(!isDeepCollabActive);
  const toggleIndependent = () => onToggleIndependentActive?.(!isIndependentActive);
  const showSoMLoading = Boolean(somLoading && independentModeEnabled && isIndependentActive);
  const isIndependentThinking = Boolean(independentModeEnabled && isIndependentActive);
  const thinkingAssistantName = isIndependentThinking ? '超大猫猫' : (activeAssistantName || '小猫猫');
  const thinkingAssistantAvatar = isIndependentThinking ? '/BigModel_Cat.png' : (activeAssistantAvatar || '/Orange_GLMCat.png');
  const thinkingAssistantModel = isIndependentThinking
    ? (independentModel || '独立模式')
    : (thinkingAssistantName === '大猫猫' ? (collabModel || 'Planner') : 'AutoGLM');

  // Check if it's a new chat (empty or just initial message)
  const isNewChat = messages.length === 0 || (messages.length === 1 && messages[0].role === 'assistant' && messages[0].content.includes('Web-AutoGLM 已就绪'));

  const displaySteps = currentPlan && currentPlan.length > 0
    ? currentPlan.map((p, i) => ({
        id: i,
        title: p.task || p.content || JSON.stringify(p),
        status: (p.status === 'completed' || p.status === 'finished') ? 'completed' : (p.status === 'in_progress' ? 'current' : 'pending')
      }))
    : steps;

  const currentStepTitle =
    displaySteps.find((s) => s.status === 'current')?.title ?? displaySteps[displaySteps.length - 1]?.title ?? '';

  const updatePipTexts = useCallback(() => {
    const state = pipStateRef.current;
    if (!state.win) return;

    const connectedText = pipIsConnected ? '已连接' : '未连接';
    const deviceText = pipDeviceModel ? `· ${pipDeviceModel}` : '';
    const aiText = isThinking ? '执行中' : '空闲';
    const allCompleted = displaySteps.length > 0 && displaySteps.every((s) => s.status === 'completed');

    const phoneSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2" width="10" height="20" rx="2" ry="2"/><path d="M12 18h.01"/></svg>`;
    const dotSvgColor = isThinking ? '#f97316' : '#10b981';
    const aiSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4" fill="${dotSvgColor}"/></svg>`;
    const stepSvg = isThinking
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/><path d="M22 12h-2"/></svg>`
      : allCompleted
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="4" fill="#d1d5db"/></svg>`;

    if (state.statusEl) {
      state.statusEl.innerHTML = `
        <span class="statusGroup">${phoneSvg}<span>${connectedText}${deviceText}</span></span>
        <span class="sep">·</span>
        <span class="statusGroup">${aiSvg}<span>AI：${aiText}</span></span>
      `;
    }
    if (state.titleEl) state.titleEl.textContent = pipChatTitle || '未命名任务';
    if (state.stepEl) state.stepEl.innerHTML = `${stepSvg}<span class="lineText">${currentStepTitle || '—'}</span>`;
  }, [pipChatTitle, pipDeviceModel, pipIsConnected, isThinking, currentStepTitle, displaySteps]);

  const getScrcpyControllerFromWindow = useCallback((): any | null => {
    if (typeof window === 'undefined') return null;
    return (window as any).scrcpyController ?? null;
  }, []);

  const getPipSourceSize = useCallback(() => {
    const canvas = pipCanvasRef?.current;
    if (canvas?.width && canvas?.height) return { width: canvas.width, height: canvas.height };
    return null;
  }, [pipCanvasRef]);

  const mapClientToSource = useCallback((args: { clientX: number; clientY: number; target: HTMLElement }) => {
    const source = getPipSourceSize();
    if (!source) return null;

    const rect = args.target.getBoundingClientRect();
    const elW = rect.width;
    const elH = rect.height;
    if (!elW || !elH) return null;

    const srcW = source.width;
    const srcH = source.height;
    const srcAR = srcW / srcH;
    const elAR = elW / elH;

    let drawW = elW;
    let drawH = elH;
    let padL = 0;
    let padT = 0;

    if (elAR > srcAR) {
      drawH = elH;
      drawW = elH * srcAR;
      padL = (elW - drawW) / 2;
    } else {
      drawW = elW;
      drawH = elW / srcAR;
      padT = (elH - drawH) / 2;
    }

    const relX = args.clientX - rect.left - padL;
    const relY = args.clientY - rect.top - padT;
    if (relX < 0 || relY < 0 || relX > drawW || relY > drawH) return null;

    const x = Math.max(0, Math.min(srcW - 1, Math.round((relX * srcW) / drawW)));
    const y = Math.max(0, Math.min(srcH - 1, Math.round((relY * srcH) / drawH)));
    return { x, y, vw: srcW, vh: srcH };
  }, [getPipSourceSize]);

  const handlePipPointerDown = useCallback(async (e: React.PointerEvent<HTMLVideoElement>) => {
    const controller = getScrcpyControllerFromWindow();
    if (!controller) return;
    const mapped = mapClientToSource({ clientX: e.clientX, clientY: e.clientY, target: e.currentTarget });
    if (!mapped) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const actionButton = e.button === 0 ? AndroidMotionEventButton.Primary : AndroidMotionEventButton.Secondary;
    const buttons = e.buttons & 1 ? AndroidMotionEventButton.Primary : AndroidMotionEventButton.None;
    await controller.injectTouch({
      action: AndroidMotionEventAction.Down,
      pointerId: BigInt(e.pointerId),
      pointerX: mapped.x,
      pointerY: mapped.y,
      videoWidth: mapped.vw,
      videoHeight: mapped.vh,
      pressure: e.pressure || 1,
      actionButton,
      buttons,
    });
  }, [getScrcpyControllerFromWindow, mapClientToSource]);

  const handlePipPointerMove = useCallback(async (e: React.PointerEvent<HTMLVideoElement>) => {
    const controller = getScrcpyControllerFromWindow();
    if (!controller) return;
    const mapped = mapClientToSource({ clientX: e.clientX, clientY: e.clientY, target: e.currentTarget });
    if (!mapped) return;
    e.preventDefault();
    const buttons = e.buttons & 1 ? AndroidMotionEventButton.Primary : AndroidMotionEventButton.None;
    await controller.injectTouch({
      action: AndroidMotionEventAction.Move,
      pointerId: BigInt(e.pointerId),
      pointerX: mapped.x,
      pointerY: mapped.y,
      videoWidth: mapped.vw,
      videoHeight: mapped.vh,
      pressure: e.pressure || (buttons ? 1 : 0),
      actionButton: 0,
      buttons,
    });
  }, [getScrcpyControllerFromWindow, mapClientToSource]);

  const handlePipPointerUp = useCallback(async (e: React.PointerEvent<HTMLVideoElement>) => {
    const controller = getScrcpyControllerFromWindow();
    if (!controller) return;
    const mapped = mapClientToSource({ clientX: e.clientX, clientY: e.clientY, target: e.currentTarget });
    if (!mapped) return;
    e.preventDefault();
    const actionButton = e.button === 0 ? AndroidMotionEventButton.Primary : AndroidMotionEventButton.Secondary;
    await controller.injectTouch({
      action: AndroidMotionEventAction.Up,
      pointerId: BigInt(e.pointerId),
      pointerX: mapped.x,
      pointerY: mapped.y,
      videoWidth: mapped.vw,
      videoHeight: mapped.vh,
      pressure: 0,
      actionButton,
      buttons: AndroidMotionEventButton.None,
    });
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  }, [getScrcpyControllerFromWindow, mapClientToSource]);

  const stopPip = useCallback(() => {
    const state = pipStateRef.current;
    if (state.win) {
      try {
        state.win.close();
      } catch {}
    }
    if (state.cleanup) {
      try {
        state.cleanup();
      } catch {}
    }
    if (state.stream) {
      for (const track of state.stream.getTracks()) {
        try {
          track.stop();
        } catch {}
      }
    }
    pipStateRef.current = { win: null, stream: null, statusEl: null, titleEl: null, stepEl: null, cleanup: null };
    setPipMode('none');
  }, []);

  const openPip = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const canvas = pipCanvasRef?.current;
    if (!canvas) return;

    if (pipMode !== 'none') {
      stopPip();
      return;
    }

    const stream = canvas.captureStream?.(30);
    if (!stream) {
      setPipMode('overlay');
      return;
    }

    const documentPip = (window as any).documentPictureInPicture;
    if (documentPip?.requestWindow) {
      const win: Window = await documentPip.requestWindow({ width: 360, height: 640 });
      const doc = win.document;

      const style = doc.createElement('style');
      style.textContent = `
        :root { color-scheme: light; }
        html, body { height: 100%; margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; }
        body { background: #0b0b0c; }
        .root { display: flex; flex-direction: column; height: 100%; width: 100%; }
        .videoWrap { flex: 1 1 auto; background: #000; display: flex; align-items: center; justify-content: center; }
        .video { width: 100%; height: 100%; object-fit: contain; }
        .info { flex: 0 0 auto; padding: 12px 12px 14px; background: #ffffff; border-top: 1px solid rgba(0,0,0,0.06); }
        .status { font-size: 12px; color: #6b7280; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; white-space: nowrap; overflow: hidden; }
        .statusGroup { display: inline-flex; align-items: center; gap: 6px; min-width: 0; }
        .sep { opacity: 0.7; }
        .title { font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .line { font-size: 13px; color: #374151; line-height: 1.35; display: flex; align-items: flex-start; gap: 8px; }
        .lineText { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; }
        .line + .line { margin-top: 6px; }
      `;
      doc.head.appendChild(style);

      doc.body.innerHTML = '';
      const root = doc.createElement('div');
      root.className = 'root';

      const videoWrap = doc.createElement('div');
      videoWrap.className = 'videoWrap';
      const video = doc.createElement('video');
      video.className = 'video';
      video.autoplay = true;
      video.muted = true;
      (video as any).playsInline = true;
      (video as any).srcObject = stream;
      videoWrap.appendChild(video);

      const info = doc.createElement('div');
      info.className = 'info';
      const statusEl = doc.createElement('div');
      statusEl.className = 'status';
      const titleEl = doc.createElement('div');
      titleEl.className = 'title';
      const stepEl = doc.createElement('div');
      stepEl.className = 'line';
      info.appendChild(statusEl);
      info.appendChild(titleEl);
      info.appendChild(stepEl);

      root.appendChild(videoWrap);
      root.appendChild(info);
      doc.body.appendChild(root);

      const onDown = async (ev: PointerEvent) => {
        const controller = getScrcpyControllerFromWindow();
        if (!controller) return;
        const mapped = mapClientToSource({ clientX: ev.clientX, clientY: ev.clientY, target: video });
        if (!mapped) return;
        ev.preventDefault();
        (video as any).setPointerCapture?.(ev.pointerId);
        const actionButton = ev.button === 0 ? AndroidMotionEventButton.Primary : AndroidMotionEventButton.Secondary;
        const buttons = ev.buttons & 1 ? AndroidMotionEventButton.Primary : AndroidMotionEventButton.None;
        await controller.injectTouch({
          action: AndroidMotionEventAction.Down,
          pointerId: BigInt(ev.pointerId),
          pointerX: mapped.x,
          pointerY: mapped.y,
          videoWidth: mapped.vw,
          videoHeight: mapped.vh,
          pressure: (ev as any).pressure || 1,
          actionButton,
          buttons,
        });
      };
      const onMove = async (ev: PointerEvent) => {
        const controller = getScrcpyControllerFromWindow();
        if (!controller) return;
        const mapped = mapClientToSource({ clientX: ev.clientX, clientY: ev.clientY, target: video });
        if (!mapped) return;
        ev.preventDefault();
        const buttons = ev.buttons & 1 ? AndroidMotionEventButton.Primary : AndroidMotionEventButton.None;
        await controller.injectTouch({
          action: AndroidMotionEventAction.Move,
          pointerId: BigInt(ev.pointerId),
          pointerX: mapped.x,
          pointerY: mapped.y,
          videoWidth: mapped.vw,
          videoHeight: mapped.vh,
          pressure: (ev as any).pressure || (buttons ? 1 : 0),
          actionButton: 0,
          buttons,
        });
      };
      const onUp = async (ev: PointerEvent) => {
        const controller = getScrcpyControllerFromWindow();
        if (!controller) return;
        const mapped = mapClientToSource({ clientX: ev.clientX, clientY: ev.clientY, target: video });
        if (!mapped) return;
        ev.preventDefault();
        const actionButton = ev.button === 0 ? AndroidMotionEventButton.Primary : AndroidMotionEventButton.Secondary;
        await controller.injectTouch({
          action: AndroidMotionEventAction.Up,
          pointerId: BigInt(ev.pointerId),
          pointerX: mapped.x,
          pointerY: mapped.y,
          videoWidth: mapped.vw,
          videoHeight: mapped.vh,
          pressure: 0,
          actionButton,
          buttons: AndroidMotionEventButton.None,
        });
        try {
          (video as any).releasePointerCapture?.(ev.pointerId);
        } catch {}
      };

      video.addEventListener('pointerdown', onDown, { passive: false });
      video.addEventListener('pointermove', onMove, { passive: false });
      video.addEventListener('pointerup', onUp, { passive: false });
      video.addEventListener('pointercancel', onUp, { passive: false });

      const cleanup = () => {
        video.removeEventListener('pointerdown', onDown as any);
        video.removeEventListener('pointermove', onMove as any);
        video.removeEventListener('pointerup', onUp as any);
        video.removeEventListener('pointercancel', onUp as any);
      };

      const pipRatio = 9 / 16;
      let resizing = false;
      const onResize = () => {
        if (resizing) return;
        resizing = true;
        try {
          const w = Math.max(1, win.innerWidth);
          const h = Math.max(1, win.innerHeight);
          const current = w / h;
          let nextW = w;
          let nextH = h;
          if (Math.abs(current - pipRatio) > 0.02) {
            if (current > pipRatio) {
              nextW = Math.round(h * pipRatio);
            } else {
              nextH = Math.round(w / pipRatio);
            }
            win.resizeTo(nextW, nextH);
          }
        } catch {}
        setTimeout(() => {
          resizing = false;
        }, 0);
      };
      win.addEventListener('resize', onResize);
      const prevCleanup = cleanup;
      const cleanupWithResize = () => {
        try {
          win.removeEventListener('resize', onResize);
        } catch {}
        prevCleanup();
      };

      pipStateRef.current = { win, stream, statusEl, titleEl, stepEl, cleanup: cleanupWithResize };
      setPipMode('document');
      updatePipTexts();

      win.addEventListener('pagehide', () => {
        if (pipStateRef.current.win === win) {
          stopPip();
        }
      });

      try {
        await video.play();
      } catch {}
    } else {
      pipStateRef.current.stream = stream;
      setPipMode('overlay');
    }
  }, [getScrcpyControllerFromWindow, mapClientToSource, pipCanvasRef, pipMode, stopPip, updatePipTexts]);

  useEffect(() => {
    updatePipTexts();
  }, [updatePipTexts]);

  useEffect(() => {
    if (pipMode !== 'overlay') return;
    const video = overlayVideoRef.current;
    if (!video) return;

    const state = pipStateRef.current;
    const canvas = pipCanvasRef?.current;
    if (!state.stream && canvas?.captureStream) {
      state.stream = canvas.captureStream(30);
    }
    if (!state.stream) return;

    (video as any).srcObject = state.stream;
    video.play().catch(() => {});

    return () => {
      try {
        (video as any).srcObject = null;
      } catch {}
    };
  }, [pipCanvasRef, pipMode]);

  useEffect(() => {
    return () => stopPip();
  }, [stopPip]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 1 && hour < 5) return `${nickname}，深夜辛苦啦 /ᐠ｡ꞈ｡ᐟ\\`;
    if (hour >= 5 && hour < 8) return `${nickname}，清晨诶 (′゜ω。‵)`;
    if (hour >= 8 && hour < 12) return `${nickname}，早上好 /ᐠ .ᆺ. ᐟ\\ﾉ！`;
    if (hour >= 12 && hour < 14) return `${nickname}，中午好 ก(ｰ̀ωｰ́ก)！`;
    if (hour >= 14 && hour < 19) return `${nickname}，下午好 (´・ω・)つ！`;
    return `${nickname}，晚上了呀 (ヾﾉ･ω･\`)...`;
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Timer logic for task execution
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isThinking) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isThinking]);

  // Reset timer only when steps are cleared (new task)
  useEffect(() => {
    if (displaySteps.length === 0) {
      setTimer(0);
    }
  }, [displaySteps]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() || isThinking) {
        if (isThinking && onStop) {
          onStop();
        } else {
          onSend();
        }
      }
    }
  };

  const handleSaveSettings = (settings: any) => {
    // setDeepCollabEnabled(settings.deepCollabEnabled); // Removed local setter
    onSaveSettings(settings);
  };

  return (
    <div className="flex-1 min-w-[380px] flex flex-col h-full relative bg-white dark:bg-[#1E1E1E] rounded-xl border border-gray-200 dark:border-[#2A2A2A] shadow-sm overflow-hidden">
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={onCloseSettings} 
        apiKey={apiKey}
        apiProvider={apiProvider}
        baseUrl={baseUrl}
        apiModel={apiModel}
        onSave={handleSaveSettings}
        adb={adb} 
        nickname={nickname}
        maxSteps={maxSteps}
        maxTokens={maxTokens}
        temperature={temperature}
        frequencyPenalty={frequencyPenalty}
        deepCollabEnabled={deepCollabEnabled}
        nakoCliEnabled={nakoCliEnabled}
        collabProvider={collabProvider}
        collabKey={collabKey}
        collabBaseUrl={collabBaseUrl}
        collabModel={collabModel}
        multimodalEnabled={multimodalEnabled}
        deepCollabExecutorMaxSteps={deepCollabExecutorMaxSteps}
        deepCollabExecutorMaxTokens={deepCollabExecutorMaxTokens}
        deepCollabExecutorTemperature={deepCollabExecutorTemperature}
        deepCollabExecutorFrequencyPenalty={deepCollabExecutorFrequencyPenalty}
        deepCollabPlannerMaxTokens={deepCollabPlannerMaxTokens}
        deepCollabPlannerTemperature={deepCollabPlannerTemperature}
        deepCollabPlannerFrequencyPenalty={deepCollabPlannerFrequencyPenalty}
        deepCollabPlannerTopP={deepCollabPlannerTopP}
        independentModeEnabled={independentModeEnabled}
        independentProvider={independentProvider}
        independentKey={independentKey}
        independentBaseUrl={independentBaseUrl}
        independentModel={independentModel}
        independentMultimodalEnabled={independentMultimodalEnabled}
        independentMaxTokens={independentMaxTokens}
        independentTemperature={independentTemperature}
        independentFrequencyPenalty={independentFrequencyPenalty}
        independentTopP={independentTopP}
        somEnabled={somEnabled}
      />
      
      <RawDataModal 
        isOpen={!!rawMessageContent} 
        onClose={() => setRawMessageContent(null)} 
        content={rawMessageContent || ''} 
      />

      {/* Header */}
      <div className="h-14 flex items-center justify-between px-[15px] border-b border-gray-100 dark:border-[#2A2A2A] bg-white dark:bg-[#1E1E1E] z-10">
        <div className="flex items-center gap-3">
          {onToggleSidebar && !isSidebarOpen && (
            <button
              onClick={onToggleSidebar}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-lg transition-colors animate-in fade-in zoom-in duration-200"
              title="切换侧边栏"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-layout-sidebar" viewBox="0 0 16 16">
                <path d="M0 3a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm5-1v12h9a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1zM4 2H2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h2z"/>
              </svg>
            </button>
          )}
          {onNewChat && !isSidebarOpen && (
            <button
              onClick={onNewChat}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:text-gray-600 hover:bg-gray-100 dark:bg-gray-700 rounded-lg transition-colors animate-in fade-in zoom-in duration-200"
              title="开启新对话"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle-plus-icon lucide-message-circle-plus"><path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
            </button>
          )}
          <div className="relative">
            <div 
              onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
              className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 px-2 py-1 rounded-lg transition-colors select-none"
            >
              <span className="text-base font-semibold text-gray-800 dark:text-gray-200">{selectedModel}</span>
              <ChevronDown 
                size={16} 
                className={`text-gray-400 transition-transform duration-200 ${isModelMenuOpen ? 'rotate-180' : ''}`} 
              />
            </div>
            
            {isModelMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setIsModelMenuOpen(false)} 
                />
                <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-[#1E1E1E] rounded-xl shadow-xl border border-gray-100 dark:border-[#2A2A2A] py-1.5 z-20 animate-in fade-in zoom-in-95 duration-200">
                  <button
                    onClick={() => {
                      setSelectedModel('Nako Web');
                      setIsModelMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-colors flex items-center justify-between ${selectedModel === 'Nako Web' ? 'text-orange-500 font-medium bg-orange-50/50' : 'text-gray-700 dark:text-gray-300 dark:text-gray-600'}`}
                  >
                    Nako Web
                    {selectedModel === 'Nako Web' && <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedModel('Nako CLI');
                      setIsModelMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-colors flex items-center justify-between ${selectedModel === 'Nako CLI' ? 'text-orange-500 font-medium bg-orange-50/50' : 'text-gray-700 dark:text-gray-300 dark:text-gray-600'}`}
                  >
                    Nako CLI
                    {selectedModel === 'Nako CLI' && <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onToggleDevicePanel && (
            <button
              onClick={onToggleDevicePanel}
              className="hidden lg:flex p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-lg transition-colors"
              title={isDevicePanelCollapsed ? '展开手机卡片' : '折叠手机卡片'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-gallery-horizontal-icon lucide-gallery-horizontal">
                <path d="M2 3v18" />
                <rect width="12" height="18" x="6" y="3" rx="2" />
                <path d="M22 3v18" />
              </svg>
            </button>
          )}
          {pipCanvasRef && (
            <button
              onClick={openPip}
              className={`hidden lg:flex p-2 rounded-lg transition-colors ${pipMode === 'none' ? 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2A2A2A]' : 'text-orange-600 bg-orange-50 hover:bg-orange-100'}`}
              title={pipMode === 'none' ? '画中画' : '关闭画中画'}
            >
              <PictureInPicture2 width="18" height="18" />
            </button>
          )}
        </div>
      </div>

      {pipMode === 'overlay' && (
        <div className="fixed right-4 bottom-4 z-50 w-[320px] h-[560px] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <div className="flex flex-col h-full">
            <div className="flex-1 bg-black">
              <video
                ref={overlayVideoRef}
                className="w-full h-full object-contain touch-none"
                muted
                playsInline
                autoPlay
                onPointerDown={handlePipPointerDown}
                onPointerMove={handlePipPointerMove}
                onPointerUp={handlePipPointerUp}
                onPointerCancel={handlePipPointerUp}
              />
            </div>
            <div className="px-3 py-3 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 text-[12px] text-gray-500">
                <div className="flex items-center gap-1 min-w-0">
                  <Smartphone size={12} className="text-gray-400" />
                  <span className="truncate">
                    {pipIsConnected ? '已连接' : '未连接'}
                    {pipDeviceModel ? `· ${pipDeviceModel}` : ''}
                  </span>
                </div>
                <span className="opacity-70">·</span>
                <div className="flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="6" cy="6" r="4" fill={isThinking ? '#f97316' : '#10b981'} />
                  </svg>
                  <span>AI：{isThinking ? '执行中' : '空闲'}</span>
                </div>
              </div>
              <div className="mt-2 text-[14px] font-semibold text-gray-800 dark:text-gray-200 truncate">{pipChatTitle || '未命名任务'}</div>
              <div className="mt-1 flex items-start gap-2 text-[13px] text-gray-600 dark:text-gray-400">
                {isThinking ? (
                  <LoaderCircle size={14} className="mt-[1px] text-orange-500 flex-shrink-0 animate-spin" />
                ) : steps.length > 0 && steps.every((s) => s.status === 'completed') ? (
                  <CheckCircle2 size={14} className="mt-[1px] text-emerald-500 flex-shrink-0" />
                ) : (
                  <Circle size={14} className="mt-[1px] text-gray-300 dark:text-gray-600 flex-shrink-0" />
                )}
                <div className="line-clamp-2">{currentStepTitle || '—'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages List or Empty State */}
      {isNewChat ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-16 animate-in fade-in duration-500">
           <div className="flex flex-col items-center mb-8">
             <div className="text-[22px] font-medium text-gray-700 dark:text-gray-300 text-center">
               {getGreeting()}
             </div>
             {isDeepCollabActive && (
                <div className="flex items-center gap-1.5 mt-2 text-[12px] text-gray-500 dark:text-gray-400 animate-in fade-in slide-in-from-top-1 duration-300">
                  <svg width="12" height="12" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg"> 
                    <path d="M22.209 0.00488281V0.00488281C22.2264 12.2607 32.1573 22.1916 44.4131 22.209V22.209V22.209C32.1573 22.2263 22.2264 32.1573 22.209 44.413V44.413V44.413C22.1916 32.1573 12.2607 22.2263 0.00491333 22.209V22.209V22.209C12.2607 22.1916 22.1916 12.2607 22.209 0.00488281V0.00488281Z" stroke="currentColor" strokeWidth="4"/> 
                  </svg>
                  <span>深度协作已打开 (」○ ω○ )／，将会使用多模型协作</span>
                </div>
              )}
             {independentModeEnabled && (
                <div className="flex items-center gap-1.5 mt-2 text-[12px] text-gray-500 dark:text-gray-400 animate-in fade-in slide-in-from-top-1 duration-300">
                  <svg width="12" height="12" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg"> 
                    <path d="M22.209 0.00488281V0.00488281C22.2264 12.2607 32.1573 22.1916 44.4131 22.209V22.209V22.209C32.1573 22.2263 22.2264 32.1573 22.209 44.413V44.413V44.413C22.1916 32.1573 12.2607 22.2263 0.00491333 22.209V22.209V22.209C12.2607 22.1916 22.1916 12.2607 22.209 0.00488281V0.00488281Z" stroke="currentColor" strokeWidth="4"/> 
                  </svg>
                  <span className="text-orange-500 font-medium">实验性功能 |</span>
                  <span>独立模式已打开 (」○ ω○ )／，大模型将自己尝试操作</span>
                </div>
              )}
           </div>
           
           <div className="w-full max-w-[760px] px-4">
             {/* Input Container Reuse */}
             <div className="flex flex-col w-full">
               <div className="w-full flex flex-col bg-white dark:bg-[#171717] rounded-[24px] border border-gray-200 dark:border-[#2A2A2A] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all duration-300 hover:shadow-lg focus-within:ring-2 focus-within:ring-orange-100 focus-within:border-orange-200">
                  <div className="flex flex-col bg-white dark:bg-[#171717]">
                    <div className="px-6 py-5">
                      <textarea 
                        value={input}
                        onChange={(e) => onInputChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full resize-none outline-none text-[15px] text-gray-700 dark:text-gray-300 dark:text-gray-600 placeholder-gray-400 dark:placeholder-gray-500 bg-transparent leading-relaxed scrollbar-hide"
                        placeholder="请提供详细指令/网址，体验更佳"
                        rows={1}
                        style={{ minHeight: '24px', maxHeight: '168px' }}
                        onInput={(e) => {
                          const target = e.target as HTMLTextAreaElement;
                          target.style.height = 'auto';
                          target.style.height = target.scrollHeight + 'px';
                        }}
                        autoFocus
                      />
                    </div>
                    <div className="flex items-center justify-between px-4 pb-4">
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full transition-colors active:scale-95" title="上传文件">
                          <Paperclip size={18} strokeWidth={2} />
                        </button>
                        {deepCollabEnabled && (
                          <button 
                            onClick={toggleDeepCollab}
                            className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-200 active:scale-95 ${
                              isDeepCollabActive 
                                ? 'border-orange-200 bg-orange-50 text-orange-600' 
                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600'
                            }`}
                          >
                            <Sparkles size={14} className={`transition-colors ${isDeepCollabActive ? 'text-orange-500' : 'text-gray-400 group-hover:text-orange-500'}`} />
                            <span className="text-xs font-medium">深度协作</span>
                          </button>
                        )}
                      </div>
                      <button 
                        onClick={onSend}
                        disabled={!input.trim()}
                        className={`p-2 rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                          input.trim() 
                            ? 'bg-orange-500 text-white shadow-md hover:bg-orange-600 hover:scale-110 rotate-0' 
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed rotate-90 scale-90'
                        }`}
                      >
                        <ArrowUp size={18} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
               </div>
               <div className="text-center text-[10px] text-gray-400 mt-6 select-none">
                  以上内容均由AI生成, 仅供参考和借鉴
               </div>
             </div>
           </div>
        </div>
      ) : (
      <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'user' ? (
              /* User Message */
              <div className="bg-[#f0f0f0] dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-2xl px-4 py-2.5 max-w-[80%] text-base leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </div>
            ) : msg.collab ? (
              <div className="flex gap-4 max-w-[90%] md:max-w-[760px]">
                <div className="flex flex-col items-center w-8 flex-shrink-0 mt-1">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-orange-100 flex items-center justify-center text-orange-500">
                    <Image
                      src={msg.senderAvatar || '/BigModel_Cat.png'}
                      alt={msg.senderName || '大猫猫'}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="w-px flex-1 border-l border-dashed border-gray-300 my-2" />
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-orange-100 flex items-center justify-center text-orange-500">
                    <Image
                      src={msg.collab.executorAvatar || '/Orange_GLMCat.png'}
                      alt={msg.collab.executorName || '小猫猫'}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{msg.senderName || '大猫猫'}</div>
                      <div className="px-2 py-0.5 rounded text-xs text-gray-500 bg-[#F7F7F7]">
                        {msg.model || (collabModel || 'Planner')}
                      </div>
                    </div>
                    {renderMessageContent(msg.content)}
                  </div>
                  {msg.collab.plannerAction && (
                    <div className="text-xs text-gray-500">大猫猫动作：{msg.collab.plannerAction}</div>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{msg.collab.executorName || '小猫猫'}</div>
                      <div className="px-2 py-0.5 rounded text-xs text-gray-500 bg-[#F7F7F7]">
                        {msg.collab.executorModel || 'AutoGLM'}
                      </div>
                    </div>
                    {msg.collab.executorActionType && (
                      <div className="mb-1">
                        <AgentActionWidget type={msg.collab.executorActionType} />
                      </div>
                    )}
                    {msg.collab.executorReply && renderMessageContent(msg.collab.executorReply)}
                    {msg.collab.executorAction && (
                      <div className="text-xs text-gray-500">小猫猫动作：{msg.collab.executorAction}</div>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-2">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-gray-400">
                        <button className="p-1 hover:text-gray-600 dark:text-gray-400 transition-colors"><Copy size={16} /></button>
                        <button className="p-1 hover:text-gray-600 dark:text-gray-400 transition-colors"><ThumbsUp size={16} /></button>
                        <button className="p-1 hover:text-gray-600 dark:text-gray-400 transition-colors"><ThumbsDown size={16} /></button>
                        <button className="p-1 hover:text-gray-600 dark:text-gray-400 transition-colors"><RotateCcw size={16} /></button>
                        <button 
                          className="p-1 hover:text-gray-600 dark:text-gray-400 transition-colors"
                          onClick={() => setRawMessageContent(msg.rawContent || msg.content)}
                          title="查看原始数据"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-type-corner-icon lucide-file-type-corner">
                            <path d="M12 22h6a2 2 0 0 0 2-2V8a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v6"/>
                            <path d="M14 2v5a1 1 0 0 0 1 1h5"/>
                            <path d="M3 16v-1.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 .5.5V16"/>
                            <path d="M6 22h2"/>
                            <path d="M7 14v8"/>
                          </svg>
                        </button>
                        {msg.step && (
                          <div className="text-xs text-gray-400 font-normal">
                            {msg.step.replace('步骤 ', '')}/{maxSteps || 30}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* AI Message */
              <div className="flex gap-4 max-w-[90%] md:max-w-[760px]">
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mt-1 bg-orange-100 flex items-center justify-center text-orange-500">
                  <Image
                    src={msg.senderAvatar || '/Orange_GLMCat.png'}
                    alt={msg.senderName || '小猫猫'}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{msg.senderName || '小猫猫'}</div>
                    <div className="px-2 py-0.5 rounded text-xs text-gray-500 bg-[#F7F7F7]">
                      {msg.model || (msg.senderName === '大猫猫' ? (collabModel || 'Planner') : 'AutoGLM')}
                    </div>
                  </div>
                  {msg.actionType && (
                    <div className="mb-1">
                      <AgentActionWidget type={msg.actionType} />
                    </div>
                  )}
                  {renderMessageContent(msg.content)}
                  
                  {/* Action Bar for AI messages (Optional, can be functional later) */}
                  <div className="flex items-center justify-between mt-4 pt-2">
                     <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-gray-400">
                          <button className="p-1 hover:text-gray-600 dark:text-gray-400 transition-colors"><Copy size={16} /></button>
                          <button className="p-1 hover:text-gray-600 dark:text-gray-400 transition-colors"><ThumbsUp size={16} /></button>
                          <button className="p-1 hover:text-gray-600 dark:text-gray-400 transition-colors"><ThumbsDown size={16} /></button>
                          <button className="p-1 hover:text-gray-600 dark:text-gray-400 transition-colors"><RotateCcw size={16} /></button>
                          <button 
                            className="p-1 hover:text-gray-600 dark:text-gray-400 transition-colors"
                            onClick={() => setRawMessageContent(msg.rawContent || msg.content)}
                            title="查看原始数据"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-type-corner-icon lucide-file-type-corner">
                              <path d="M12 22h6a2 2 0 0 0 2-2V8a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v6"/>
                              <path d="M14 2v5a1 1 0 0 0 1 1h5"/>
                              <path d="M3 16v-1.5a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 .5.5V16"/>
                              <path d="M6 22h2"/>
                              <path d="M7 14v8"/>
                            </svg>
                          </button>
                          {msg.step && (
                            <div className="text-xs text-gray-400 font-normal">
                              {msg.step.replace('步骤 ', '')}/{maxSteps || 30}
                            </div>
                          )}
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* Thinking Indicator */}
        {isThinking && (
          <div className="flex gap-4 max-w-[90%] md:max-w-[760px]">
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mt-1 bg-orange-100 flex items-center justify-center text-orange-500">
              <Image
                src={thinkingAssistantAvatar}
                alt={thinkingAssistantName}
                width={32}
                height={32}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
            <div className="flex-1 space-y-2">
               <div className="flex items-center gap-2">
                 <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{thinkingAssistantName}</div>
                 <div className="px-2 py-0.5 rounded text-xs text-gray-500 bg-[#F7F7F7]">
                   {thinkingAssistantModel}
                 </div>
               </div>
               {showSoMLoading ? (
                 <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                   <div className="w-4 h-4 border-2 border-gray-200 dark:border-gray-700 border-t-orange-500 rounded-full animate-spin" />
                   <div>加载中</div>
                 </div>
               ) : (
                 <div className="flex items-center gap-2 mt-2">
                   <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                   <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                   <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                 </div>
               )}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      )}

      {/* Input Area (Only show when NOT in new chat mode) */}
      {!isNewChat && (
      <div className="p-6 md:px-12 pb-10 bg-white dark:bg-gray-800 flex justify-center">
        <div className="w-full max-w-[760px]">
           {/* 核心布局容器：统一的大卡片 */}
           <div className="flex flex-col w-full">
             
             {/* 合并后的容器：圆角、阴影、边框统一管理 */}
             <div className="w-full flex flex-col bg-white dark:bg-[#171717] rounded-[24px] border border-gray-200 dark:border-[#2A2A2A] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all duration-300 hover:shadow-lg focus-within:ring-2 focus-within:ring-orange-100 focus-within:border-orange-200">
               
               {/* ================= 1. Top Section: 任务状态 (Header) ================= */}
               {/* Only show if there are steps */}
               {displaySteps.length > 0 && (
                 <div className="bg-slate-50 dark:bg-[#2A2A2A] border-b border-gray-100 dark:border-[#2A2A2A] transition-colors duration-300">
                   
                   {/* Header Bar */}
                   <div className="flex items-center justify-between px-4 py-3">
                     <div className="flex items-center gap-2.5">
                       <div 
                         className={`rounded-full flex-shrink-0 transition-colors duration-300 ${isThinking ? 'bg-amber-400 animate-pulse' : 'bg-[#36b261]'}`} 
                         style={{ width: '14px', height: '14px' }} 
                       />
                       <div className="text-[14px] font-bold text-gray-700 dark:text-gray-300 dark:text-gray-600 tracking-tight">
                          {isThinking ? '任务进行中' : '任务已结束'}
                       </div>
                       <span className="text-xs text-gray-400 font-mono tracking-wide ml-0.5 pt-0.5">
                         {formatTime(timer)}
                       </span>
                     </div>
                     
                     <div 
                       onClick={() => setIsTaskOpen(!isTaskOpen)} 
                       className="relative group cursor-pointer w-7 h-7 flex items-center justify-center rounded hover:bg-black/5 transition-all" 
                     >
                       <AppWindow 
                           size={16} 
                           strokeWidth={1.5} 
                           className="text-gray-400 group-hover:opacity-0 transition-opacity duration-200" 
                       />
                       <div className="absolute inset-0 bg-gray-800 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-[1px]">
                          {isTaskOpen ? (
                            <Minimize2 size={12} className="text-white" />
                          ) : (
                            <Maximize2 size={12} className="text-white" />
                          )}
                       </div>
                     </div>
                   </div>
     
                   {/* Collapsible List */}
                   <div className={`transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden ${isTaskOpen ? 'max-h-[500px] opacity-100 border-t border-gray-100 dark:border-[#2A2A2A]/50' : 'max-h-0 opacity-0'}`}>
                     <div className="px-5 py-4 bg-slate-50 dark:bg-[#1E1E1E]">
                       <div className="space-y-0">
                         {displaySteps.map((step, index) => {
                           const isLast = index === displaySteps.length - 1;
                           const isCompleted = step.status === 'completed';
                           const isCurrent = step.status === 'current';
                           const isPending = step.status === 'pending';
     
                           return (
                             <div key={step.id} className="relative flex gap-3.5 group">
                               {!isLast && (
                                 <div className="absolute left-[11px] top-7 w-[2px] h-[calc(100%+4px)] bg-gray-200/50 -z-0">
                                   <div className={`w-full bg-[#36b261] transition-all duration-500 ease-linear ${isCompleted ? 'h-full' : 'h-0'}`} />
                                 </div>
                               )}
                               <div className={`
                                 relative z-10 flex-shrink-0 w-6 h-6 mt-0.5 rounded-full border-[1.5px] flex items-center justify-center transition-all duration-300
                                 ${isCompleted
                                   ? 'bg-[#36b261] border-[#36b261] text-white'
                                   : isCurrent
                                     ? 'bg-white dark:bg-gray-800 border-amber-400 shadow-[0_0_0_2px_rgba(251,191,36,0.15)] scale-110'
                                     : 'bg-white dark:bg-gray-800 border-gray-300'
                                 }
                               `}>
                                 {isCompleted && <Check size={12} strokeWidth={3} />}
                                 {isCurrent && <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />}
                               </div>
                               <div className={`pb-6 flex-1 flex items-center transition-opacity duration-300 ${isPending ? 'opacity-40' : 'opacity-100'}`}>
                                 <span className={`text-[13px] font-medium transition-colors ${isCurrent ? 'text-amber-600' : isCompleted ? 'text-gray-500 line-through decoration-[#36b261]/30' : 'text-gray-600 dark:text-gray-400'}`}>
                                   {step.title}
                                 </span>
                               </div>
                             </div>
                           );
                         })}
                       </div>
                       <div className="pt-2 mt-1 border-t border-gray-200 dark:border-gray-700/50 flex justify-end">
                         <button 
                           onClick={onRestart}
                           disabled={isThinking || !onRestart}
                           className="group flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium text-gray-400 hover:text-[#36b261] hover:bg-green-50 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
                         >
                           <RotateCcw size={10} className="group-hover:-rotate-180 transition-transform duration-500" />
                           重新运行
                         </button>
                       </div>
                     </div>
                   </div>
                 </div>
               )}
     
               {/* ================= 2. Bottom Section: 输入区域 (Body) ================= */}
               <div className="flex flex-col bg-white dark:bg-[#171717]">
                  {/* Textarea */}
                  <div className="px-4 py-3">
                    <textarea 
                      value={input}
                      onChange={(e) => onInputChange(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full resize-none outline-none text-[15px] text-gray-700 dark:text-gray-300 dark:text-gray-600 placeholder-gray-400 dark:placeholder-gray-500 bg-transparent leading-relaxed scrollbar-hide"
                      placeholder="请提供详细指令/网址，体验更佳"
                      rows={1}
                      style={{ minHeight: '24px', maxHeight: '168px' }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = target.scrollHeight + 'px';
                      }}
                    />
                  </div>
                  
                  {/* Toolbar */}
                  <div className="flex items-center justify-between px-3 pb-2.5">
                    <div className="flex items-center gap-2">
                      <button 
                       className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full transition-colors active:scale-95" 
                       title="上传文件" 
                      >
                        <Paperclip size={18} strokeWidth={2} />
                      </button>
                      
                      {deepCollabEnabled && (
                        <button 
                          onClick={toggleDeepCollab}
                          className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-200 active:scale-95 ${
                            isDeepCollabActive 
                              ? 'border-orange-200 bg-orange-50 text-orange-600' 
                              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600'
                          }`}
                        >
                          <Sparkles size={14} className={`transition-colors ${isDeepCollabActive ? 'text-orange-500' : 'text-gray-400 group-hover:text-orange-500'}`} />
                          <span className="text-xs font-medium">深度协作</span>
                        </button>
                      )}
                    </div>
                    
                    <button 
                      onClick={isThinking ? onStop : onSend}
                      disabled={(!input.trim() && !isThinking)}
                      className={`p-2 rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                        isThinking 
                           ? 'bg-red-500 text-white shadow-md hover:bg-red-600 hover:scale-110 rotate-0' 
                           : (input.trim() 
                              ? 'bg-orange-500 text-white shadow-md hover:bg-orange-600 hover:scale-110 rotate-0' 
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed rotate-90 scale-90')
                      }`}
                    >
                      {isThinking ? <Square size={16} fill="currentColor" /> : <ArrowUp size={18} strokeWidth={2.5} />}
                    </button>
                  </div>
               </div>
             </div>
     
             {/* 底部声明 */}
             <div className="text-center text-[10px] text-gray-400 mt-3 select-none">
                以上内容均由AI生成, 仅供参考和借鉴
             </div>
     
           </div>
        </div>
      </div>
      )}
    </div>
  );
}
