import { useCallback, useRef, useState, type RefObject } from 'react';
import { MessageBuilder } from '@/lib/agent/message-builder';
import { getScreenshotFromCanvas, stripBase64Prefix } from '@/lib/agent/screenshot-utils';
import { parseModelResponse } from '@/lib/agent/response-parser';
import { extractActionParams } from '@/lib/agent/action-extractor';
import { InputManager, installAdbKeyboard } from '@/lib/device/input-manager';
import { DeviceController } from '@/lib/device/device-control';
import { Adb } from '@yume-chan/adb';
import { GoogleGenAI } from '@google/genai';
import {
  AndroidKeyCode,
  AndroidKeyEventAction,
  AndroidKeyEventMeta,
  AndroidMotionEventAction,
  AndroidMotionEventButton,
} from '@yume-chan/scrcpy';
import { AgentAction, mapCoordinates } from '@/lib/agent/agent-core';
import { EXECUTOR_PROMPTS, PLANNER_PROMPTS, fillTemplate } from '@/lib/prompts/deep-collab/prompts';

type ScrcpyController = {
  injectTouch: (args: any) => Promise<void>;
  injectKeyCode: (args: any) => Promise<void>;
  injectText: (text: string) => Promise<void>;
};

type PlannerDecision = {
  thought?: string;
  plan?: any[];
  tool: string;
  args: any[];
  raw: string;
};

type ApiConfig = {
  apiKey: string;
  provider?: string;
  baseUrl?: string;
  model?: string;
};

type ModelParams = {
  maxTokens?: number;
  temperature?: number;
  frequencyPenalty?: number;
  topP?: number;
  responseFormatJson?: boolean;
  stop?: string[];
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

const callGeminiDirect = async (config: ApiConfig, payload: any, signal: AbortSignal) => {
  const model = payload?.model || config.model || 'gemini-3-flash-preview';
  const { contents, config: requestConfig } = buildGeminiRequest(payload);
  const ai = new GoogleGenAI({ apiKey: config.apiKey });
  if (config.baseUrl) {
    requestConfig.httpOptions = { baseUrl: config.baseUrl.replace(/\/+$/, '') };
  }
  requestConfig.abortSignal = signal;
  const response = await ai.models.generateContent({ model, contents, config: requestConfig });
  return response.text ?? '';
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

const executeAction = async (action: AgentAction, canvas: HTMLCanvasElement) => {
  const controller = getControllerFromWindow();
  const videoWidth = canvas.width || Math.round(canvas.getBoundingClientRect().width);
  const videoHeight = canvas.height || Math.round(canvas.getBoundingClientRect().height);

  if (!controller) {
    throw new Error('Scrcpy controller not available');
  }

  if (action.type === 'click' || action.type === 'double_click' || action.type === 'long_press') {
    const [aiX, aiY] = action.params as [number, number];
    if (isNaN(Number(aiX)) || isNaN(Number(aiY))) {
       console.error(`[DeepCollab] Invalid coordinates for ${action.type}:`, action.params);
       return;
    }
    const { x, y } = mapCoordinates(Number(aiX), Number(aiY), videoWidth, videoHeight, 1000);
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
    const [sx, sy, ex, ey] = action.params as [number, number, number, number];
    const start = mapCoordinates(Number(sx), Number(sy), videoWidth, videoHeight, 1000);
    const end = mapCoordinates(Number(ex), Number(ey), videoWidth, videoHeight, 1000);
    const pointerId = BigInt(1);
    const steps = 10;
    const duration = 300;
    const stepDelay = duration / steps;

    await controller.injectTouch({
      action: AndroidMotionEventAction.Down,
      pointerId,
      pointerX: start.x,
      pointerY: start.y,
      videoWidth,
      videoHeight,
      pressure: 1,
      actionButton: AndroidMotionEventButton.Primary,
      buttons: AndroidMotionEventButton.Primary,
    });

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const x = start.x + (end.x - start.x) * t;
      const y = start.y + (end.y - start.y) * t;
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

    await sleep(stepDelay);
    await controller.injectTouch({
      action: AndroidMotionEventAction.Up,
      pointerId,
      pointerX: end.x,
      pointerY: end.y,
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
    const adb = (window as any).adb as Adb | undefined;
    if (adb) {
      const inputManager = new InputManager(adb);
      try {
        await inputManager.typeText(str);
        return;
      } catch (e: any) {
        if (e.message === 'ADB_KEYBOARD_NOT_INSTALLED') {
          try {
            await installAdbKeyboard(adb);
            await inputManager.typeText(str);
            return;
          } catch {
            // fallthrough
          }
        }
      }
    }
    const controller = getControllerFromWindow();
    if (!controller) throw new Error('Scrcpy controller not available');
    await controller.injectText(str);
    return;
  }

  if (action.type === 'back' || action.type === 'home') {
    const controller = getControllerFromWindow();
    if (!controller) throw new Error('Scrcpy controller not available');
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
      await executeShell(`monkey -p ${appName} -c android.intent.category.LAUNCHER 1`);
    }
    return;
  }

  if (action.type === 'take_over') return;
  if (action.type === 'finish') return;

  throw new Error(`Unsupported action: ${action.type}`);
};

const stripCodeFences = (s: string) => {
  const t = String(s ?? '').trim();
  const fenced = t.match(/^```[a-zA-Z]*\s*([\s\S]*?)\s*```$/);
  return fenced ? fenced[1].trim() : t;
};

const parsePlannerDecision = (raw: string): PlannerDecision | null => {
  const cleaned = stripCodeFences(raw).trim();
  if (!cleaned) return null;
  if (/^null$/i.test(cleaned)) return null;
  if (/^\s*json\s*:\s*null\s*$/i.test(cleaned)) return null;

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  const jsonText = jsonMatch ? jsonMatch[0] : cleaned;
  try {
    const obj = JSON.parse(jsonText);
    if (obj === null) return null;
    const tool = typeof obj.tool === 'string' ? obj.tool : '';
    const args = Array.isArray(obj.args) ? obj.args : [];
    const thought = typeof obj.thought === 'string' ? obj.thought : undefined;
    const plan = Array.isArray(obj.plan) ? obj.plan : undefined;
    if (!tool) return null;
    return { tool, args, thought, plan, raw };
  } catch {
    return null;
  }
};

const buildPayload = (config: ApiConfig, systemPrompt: string, userContent: any, params?: ModelParams) => {
  const payload: any = {
    model: config.model || '',
    messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userContent }],
  };
  if (params?.temperature !== undefined) payload.temperature = params.temperature;
  if (params?.maxTokens !== undefined) payload.max_tokens = params.maxTokens;
  if (params?.frequencyPenalty !== undefined) payload.frequency_penalty = params.frequencyPenalty;
  if (params?.topP !== undefined) payload.top_p = params.topP;
  if (params?.responseFormatJson) payload.response_format = { type: 'json_object' };
  if (params?.stop?.length) payload.stop = params.stop;
  return payload;
};

export function useDeepCollabLoop(params: {
  canvasRef: RefObject<HTMLCanvasElement>;
  isConnected: boolean;
  restrictedAppsMode: boolean;
}) {
  const { canvasRef, isConnected, restrictedAppsMode } = params;
  const [isRunning, setIsRunning] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<any[] | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastScreenTextRef = useRef<string>('');
  const historyLinesRef = useRef<string[]>([]);

  const stopTask = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    lastScreenTextRef.current = '';
    historyLinesRef.current = [];
    setCurrentPlan(null);
  }, []);

  const callApi = useCallback(async (config: ApiConfig, payload: any, signal: AbortSignal) => {
    if (config.provider === 'gemini') {
      return callGeminiDirect(config, payload, signal);
    }
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
      const provider = config.provider || 'zhipu';
      const baseUrl = config.baseUrl || '';
      const model = payload?.model || '';
      throw new Error(`API Request Failed: ${res.status} provider=${provider} model=${model} baseUrl=${baseUrl} ${errorText}`);
    }
    const data = await res.json();
    const rawContent = data?.choices?.[0]?.message?.content;
    return typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent ?? '');
  }, []);

  const describeScreen = useCallback(
    async (executorConfig: ApiConfig, executorParams: ModelParams, base64Image: string, signal: AbortSignal) => {
      const prompt = EXECUTOR_PROMPTS.SCREEN_DESCRIBER;
      const userMsg = MessageBuilder.createUserMessage('Describe screen', base64Image);
      const payload = buildPayload(
        { ...executorConfig, model: executorConfig.model || 'autoglm-phone' },
        prompt,
        userMsg.content,
        executorParams
      );
      const raw = await callApi(executorConfig, payload, signal);
      const { action } = parseModelResponse(raw);
      return String(action ?? '').trim();
    },
    [callApi]
  );

  const executorCall = useCallback(
    async (
      executorConfig: ApiConfig,
      executorParams: ModelParams,
      tool: string,
      args: any[],
      base64Image: string,
      signal: AbortSignal
    ) => {
      const prompt = fillTemplate(EXECUTOR_PROMPTS.UNIVERSAL_WORKER, {
        tool,
        args: Array.isArray(args) ? args.join(', ') : String(args ?? ''),
      });
      const userMsg = MessageBuilder.createUserMessage(`Tool=${tool}\nArgs=${JSON.stringify(args ?? [])}`, base64Image);
      const payload = buildPayload(
        { ...executorConfig, model: executorConfig.model || 'autoglm-phone' },
        prompt,
        userMsg.content,
        executorParams
      );
      const raw = await callApi(executorConfig, payload, signal);
      const { thinking, action: actionString } = parseModelResponse(raw);
      const call = extractActionParams(actionString);
      let action: AgentAction = { type: 'error', params: [], thought: thinking, raw };
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
          action = { type: type as any, params: call.args, thought: thinking, raw };
        }
      }
      return action;
    },
    [callApi]
  );

  const visualQa = useCallback(
    async (executorConfig: ApiConfig, executorParams: ModelParams, question: string, base64Image: string, signal: AbortSignal) => {
      const prompt = fillTemplate(EXECUTOR_PROMPTS.VISUAL_QA, { question });
      const userMsg = MessageBuilder.createUserMessage(question, base64Image);
      const payload = buildPayload(
        { ...executorConfig, model: executorConfig.model || 'autoglm-phone' },
        prompt,
        userMsg.content,
        executorParams
      );
      const raw = await callApi(executorConfig, payload, signal);
      const { action } = parseModelResponse(raw);
      return String(action ?? '').trim();
    },
    [callApi]
  );

  const plannerCall = useCallback(
    async (
      plannerConfig: ApiConfig,
      plannerParams: ModelParams,
      opts: { userTask: string; screenText: string; history: string; multimodal: boolean; base64Image?: string },
      signal: AbortSignal
    ) => {
      const systemPrompt = fillTemplate(opts.multimodal ? PLANNER_PROMPTS.MULTIMODAL : PLANNER_PROMPTS.TEXT_ONLY, {
        userTask: opts.userTask,
        screenText: opts.screenText,
        history: opts.history,
      });

      const userContent = opts.multimodal
        ? MessageBuilder.createUserMessage('Next step', opts.base64Image).content
        : 'Next step';

      const payload = buildPayload(plannerConfig, systemPrompt, userContent, plannerParams);
      const raw = await callApi(plannerConfig, payload, signal);
      return { raw, decision: parsePlannerDecision(raw) };
    },
    [callApi]
  );

  const preheat = useCallback(
    async (
      executorConfig: ApiConfig,
      plannerConfig: ApiConfig,
      opts: {
        multimodal: boolean;
        executorParams: ModelParams;
        plannerParams: ModelParams;
      }
    ) => {
      if (!isConnected) throw new Error('Device not connected');
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not ready');
      if (!executorConfig.apiKey) throw new Error('Missing API Key');
      if (!plannerConfig.apiKey) throw new Error('Missing Planner API Key');

      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      const screenshot = getScreenshotFromCanvas(canvas);
      if (screenshot.isSensitive) {
        throw new Error('Screen content is protected (sensitive), cannot proceed.');
      }
      const base64Data = stripBase64Prefix(screenshot.base64Data);

      console.group('[DeepCollab] Preheat');
      const screenText = await describeScreen(executorConfig, opts.executorParams, base64Data, signal);
      lastScreenTextRef.current = screenText;
      console.log('ScreenText:', screenText);

      const preheatPrompt = fillTemplate(PLANNER_PROMPTS.PREHEAT, { screenText });
      const payload = buildPayload(plannerConfig, preheatPrompt, 'PREHEAT', opts.plannerParams);
      const raw = await callApi(plannerConfig, payload, signal);
      console.log('Planner Raw:', raw);
      const cleaned = stripCodeFences(raw).trim();
      if (!/^null$/i.test(cleaned) && !/^\s*json\s*:\s*null\s*$/i.test(cleaned)) {
        const maybe = parsePlannerDecision(raw);
        if (maybe) {
          console.warn('[DeepCollab] Preheat expected null, got:', maybe);
        }
      }
      console.groupEnd();
    },
    [canvasRef, callApi, describeScreen, isConnected]
  );

  const startTask = useCallback(
    async (
      userTask: string,
      executorConfig: ApiConfig,
      plannerConfig: ApiConfig,
      opts: {
        multimodal: boolean;
        maxSteps?: number;
        executorParams: ModelParams;
        plannerParams: ModelParams;
        onStep?: (info: { step: number; action: AgentAction; planner?: PlannerDecision }) => void;
      }
    ) => {
      if (!isConnected) throw new Error('Device not connected');
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas not ready');
      if (!executorConfig.apiKey) throw new Error('Missing API Key');
      if (!plannerConfig.apiKey) throw new Error('Missing Planner API Key');

      setIsRunning(true);
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      try {
        const maxSteps = Math.min(120, Math.max(1, opts.maxSteps ?? 120));
        historyLinesRef.current = [];

        for (let step = 0; step < maxSteps; step++) {
          if (signal.aborted) throw new Error('Task stopped by user');
          const screenshot = getScreenshotFromCanvas(canvas);
          if (screenshot.isSensitive) throw new Error('Screen content is protected (sensitive), cannot proceed.');
          const base64Data = stripBase64Prefix(screenshot.base64Data);

          let screenText = lastScreenTextRef.current;
          if (!opts.multimodal) {
            screenText = await describeScreen(executorConfig, opts.executorParams, base64Data, signal);
            lastScreenTextRef.current = screenText;
          }

          const history = historyLinesRef.current.slice(-20).join('\n');
          const { raw, decision } = await plannerCall(
            plannerConfig,
            opts.plannerParams,
            { userTask, screenText, history, multimodal: opts.multimodal, base64Image: base64Data },
            signal
          );

          if (!decision) {
            const action: AgentAction = { type: 'finish', params: [raw], raw };
            opts.onStep?.({ step, action, planner: { tool: 'Finish', args: [raw], raw } });
            return { finished: true, message: raw };
          }

          if (decision.plan) {
            setCurrentPlan(decision.plan);
          }

          const tool = String(decision.tool || '').trim();
          const args = Array.isArray(decision.args) ? decision.args : [];
          historyLinesRef.current.push(`Planner: ${tool} ${JSON.stringify(args)}`);

          if (tool.toLowerCase() === 'finish') {
            const reason = args?.[0] ?? '';
            const action: AgentAction = { type: 'finish', params: [String(reason)], thought: decision.thought, raw: decision.raw };
            opts.onStep?.({ step, action, planner: decision });
            return { finished: true, message: String(reason) };
          }

          if (tool.toLowerCase() === 'query') {
            const question = String(args?.[0] ?? '');
            const answer = await visualQa(executorConfig, opts.executorParams, question, base64Data, signal);
            historyLinesRef.current.push(`QA Q: ${question}`);
            historyLinesRef.current.push(`QA A: ${answer}`);
            const action: AgentAction = { type: 'wait', params: [0], thought: `QUERY: ${question}\n${answer}`, raw: decision.raw };
            opts.onStep?.({ step, action, planner: decision });
            step -= 1;
            continue;
          }

          const execAction = await executorCall(executorConfig, opts.executorParams, tool, args, base64Data, signal);
          opts.onStep?.({ step, action: execAction, planner: decision });

          if (execAction.type === 'take_over') {
            return { finished: true, message: 'AI requested manual takeover (Take_over)' };
          }
          if (execAction.type !== 'error') {
            await executeAction(execAction, canvas);
          }

          await sleep(800);
        }

        return { finished: false, message: 'Max steps reached' };
      } finally {
        setIsRunning(false);
        abortControllerRef.current = null;
      }
    },
    [canvasRef, describeScreen, executorCall, isConnected, plannerCall, visualQa]
  );

  return { preheat, startTask, stopTask, isRunning, reset, currentPlan };
}
