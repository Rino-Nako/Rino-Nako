'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ChatPanel from '@/components/chat/ChatPanel';
import DevicePanel from '@/components/device/DevicePanel';
import Sidebar from '@/components/layout/Sidebar';
import WelcomeModal from '@/components/settings/WelcomeModal';
import { Message } from '@/types';
import { TaskStep } from '@/components/chat/TaskStatus';
import { useScrcpy } from '@/hooks/useScrcpy';
import { useAgentLoop } from '@/hooks/useAgentLoop';
import { useDeepCollabLoop } from '@/hooks/useDeepCollabLoop';
import { useChatSessions } from '@/hooks/useChatSessions';
import { getCookie, setCookie } from '@/lib/utils/cookie';
import { getInteractableElementsWithDebug } from '@/lib/som/xml-parser';
import { drawSoMOverlayMask } from '@/lib/som/som-renderer';



export default function Home() {
  // 状态管理
  const [input, setInput] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiProvider, setApiProvider] = useState('zhipu');
  const [baseUrl, setBaseUrl] = useState('');
  const [apiModel, setApiModel] = useState('');
  const [restrictedAppsMode, setRestrictedAppsMode] = useState(true);
  const [steps, setSteps] = useState<TaskStep[]>([]);
  const [nickname, setNickname] = useState('');
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDevicePanelCollapsed, setIsDevicePanelCollapsed] = useState(false);

  // New customizable parameters
  const [maxSteps, setMaxSteps] = useState(30);
  const [maxTokens, setMaxTokens] = useState(3000);
  const [temperature, setTemperature] = useState(0.1);
  const [frequencyPenalty, setFrequencyPenalty] = useState(0.2);
  const [nakoCliEnabled, setNakoCliEnabled] = useState(false);
  
  // Deep Collab Settings
  const [deepCollabEnabled, setDeepCollabEnabled] = useState(false);
  const [collabProvider, setCollabProvider] = useState('openai');
  const [collabKey, setCollabKey] = useState('');
  const [collabBaseUrl, setCollabBaseUrl] = useState('');
  const [collabModel, setCollabModel] = useState('');
  const [multimodalEnabled, setMultimodalEnabled] = useState(false);
  const [deepCollabExecutorMaxSteps, setDeepCollabExecutorMaxSteps] = useState(120);
  const [deepCollabExecutorMaxTokens, setDeepCollabExecutorMaxTokens] = useState(256);
  const [deepCollabExecutorTemperature, setDeepCollabExecutorTemperature] = useState(0.0);
  const [deepCollabExecutorFrequencyPenalty, setDeepCollabExecutorFrequencyPenalty] = useState(1.1);
  const [deepCollabPlannerMaxTokens, setDeepCollabPlannerMaxTokens] = useState(1024);
  const [deepCollabPlannerTemperature, setDeepCollabPlannerTemperature] = useState(0.1);
  const [deepCollabPlannerFrequencyPenalty, setDeepCollabPlannerFrequencyPenalty] = useState(0.0);
  const [deepCollabPlannerTopP, setDeepCollabPlannerTopP] = useState(0.1);
  const [isDeepCollabActive, setIsDeepCollabActive] = useState(false);
  const [pendingDeepCollabPreheat, setPendingDeepCollabPreheat] = useState(false);
  const [independentModeEnabled, setIndependentModeEnabled] = useState(false);
  const [independentProvider, setIndependentProvider] = useState('openai');
  const [independentKey, setIndependentKey] = useState('');
  const [independentBaseUrl, setIndependentBaseUrl] = useState('');
  const [independentModel, setIndependentModel] = useState('');
  const [independentMultimodalEnabled, setIndependentMultimodalEnabled] = useState(true);
  const [independentMaxTokens, setIndependentMaxTokens] = useState(1024);
  const [independentTemperature, setIndependentTemperature] = useState(0.2);
  const [independentFrequencyPenalty, setIndependentFrequencyPenalty] = useState(0.0);
  const [independentTopP, setIndependentTopP] = useState(0.8);
  const [somEnabled, setSomEnabled] = useState(false);
  const [isIndependentActive, setIsIndependentActive] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [somOverlayImage, setSomOverlayImage] = useState<string | null>(null);
  const [isSoMRefreshing, setIsSoMRefreshing] = useState(false);
  const [somDebugContent, setSomDebugContent] = useState<string | null>(null);

  // Chat Sessions Hook
  const {  
    sessions, 
    currentSessionId, 
    currentMessages: messages, 
    createSession, 
    deleteSession, 
    switchSession, 
    updateCurrentSessionMessages: setMessages 
  } = useChatSessions();

  // Load Settings from localStorage
  useEffect(() => {
    const storedKey = localStorage.getItem('zhipu_api_key');
    if (storedKey) setApiKey(storedKey);
    
    const storedProvider = localStorage.getItem('api_provider');
    if (storedProvider) setApiProvider(storedProvider);
    
    const storedBaseUrl = localStorage.getItem('api_base_url');
    if (storedBaseUrl) setBaseUrl(storedBaseUrl);

    const storedModel = localStorage.getItem('api_model');
    if (storedModel) setApiModel(storedModel);

    const storedRestrictedMode = localStorage.getItem('restricted_apps_mode');
    if (storedRestrictedMode !== null) {
      setRestrictedAppsMode(storedRestrictedMode === 'true');
    }

    const storedMaxSteps = localStorage.getItem('max_steps');
    if (storedMaxSteps) setMaxSteps(Number(storedMaxSteps));

    const storedMaxTokens = localStorage.getItem('max_tokens');
    if (storedMaxTokens) setMaxTokens(Number(storedMaxTokens));

    const storedTemperature = localStorage.getItem('temperature');
    if (storedTemperature) setTemperature(Number(storedTemperature));

    const storedFrequencyPenalty = localStorage.getItem('frequency_penalty');
    if (storedFrequencyPenalty) setFrequencyPenalty(Number(storedFrequencyPenalty));

    const storedNakoCliEnabled = localStorage.getItem('nako_cli_enabled');
    if (storedNakoCliEnabled !== null) {
      setNakoCliEnabled(storedNakoCliEnabled === 'true');
    }

    const storedDeepCollab = localStorage.getItem('deep_collab_enabled');
    if (storedDeepCollab !== null) setDeepCollabEnabled(storedDeepCollab === 'true');

    const storedCollabProvider = localStorage.getItem('collab_provider');
    if (storedCollabProvider) setCollabProvider(storedCollabProvider);

    const storedCollabKey = localStorage.getItem('collab_key');
    if (storedCollabKey) setCollabKey(storedCollabKey);

    const storedCollabBaseUrl = localStorage.getItem('collab_base_url');
    if (storedCollabBaseUrl) setCollabBaseUrl(storedCollabBaseUrl);

    const storedCollabModel = localStorage.getItem('collab_model');
    if (storedCollabModel) setCollabModel(storedCollabModel);

    const storedMultimodal = localStorage.getItem('multimodal_enabled');
    const storedMultimodalBool = storedMultimodal !== null ? storedMultimodal === 'true' : false;
    if (storedMultimodal !== null) setMultimodalEnabled(storedMultimodalBool);

    const storedDeepCollabExecutorMaxSteps = localStorage.getItem('deep_collab_executor_max_steps');
    if (storedDeepCollabExecutorMaxSteps) setDeepCollabExecutorMaxSteps(Number(storedDeepCollabExecutorMaxSteps));

    const storedDeepCollabExecutorMaxTokens = localStorage.getItem('deep_collab_executor_max_tokens');
    if (storedDeepCollabExecutorMaxTokens) setDeepCollabExecutorMaxTokens(Number(storedDeepCollabExecutorMaxTokens));

    const storedDeepCollabExecutorTemperature = localStorage.getItem('deep_collab_executor_temperature');
    if (storedDeepCollabExecutorTemperature) setDeepCollabExecutorTemperature(Number(storedDeepCollabExecutorTemperature));

    const storedDeepCollabExecutorFrequencyPenalty = localStorage.getItem('deep_collab_executor_frequency_penalty');
    if (storedDeepCollabExecutorFrequencyPenalty) setDeepCollabExecutorFrequencyPenalty(Number(storedDeepCollabExecutorFrequencyPenalty));

    const storedDeepCollabPlannerMaxTokens = localStorage.getItem('deep_collab_planner_max_tokens');
    if (storedDeepCollabPlannerMaxTokens) setDeepCollabPlannerMaxTokens(Number(storedDeepCollabPlannerMaxTokens));

    const storedDeepCollabPlannerTemperature = localStorage.getItem('deep_collab_planner_temperature');
    if (storedDeepCollabPlannerTemperature) {
      setDeepCollabPlannerTemperature(Number(storedDeepCollabPlannerTemperature));
    } else {
      setDeepCollabPlannerTemperature(storedMultimodalBool ? 0.2 : 0.1);
    }

    const storedDeepCollabPlannerFrequencyPenalty = localStorage.getItem('deep_collab_planner_frequency_penalty');
    if (storedDeepCollabPlannerFrequencyPenalty) setDeepCollabPlannerFrequencyPenalty(Number(storedDeepCollabPlannerFrequencyPenalty));

    const storedDeepCollabPlannerTopP = localStorage.getItem('deep_collab_planner_top_p');
    if (storedDeepCollabPlannerTopP) {
      setDeepCollabPlannerTopP(Number(storedDeepCollabPlannerTopP));
    } else {
      setDeepCollabPlannerTopP(storedMultimodalBool ? 0.8 : 0.1);
    }

    const storedIndependentModeEnabled = localStorage.getItem('independent_mode_enabled');
    if (storedIndependentModeEnabled !== null) {
      setIndependentModeEnabled(storedIndependentModeEnabled === 'true');
    }

    const storedIndependentProvider = localStorage.getItem('independent_provider');
    if (storedIndependentProvider) setIndependentProvider(storedIndependentProvider);

    const storedIndependentKey = localStorage.getItem('independent_key');
    if (storedIndependentKey) setIndependentKey(storedIndependentKey);

    const storedIndependentBaseUrl = localStorage.getItem('independent_base_url');
    if (storedIndependentBaseUrl) setIndependentBaseUrl(storedIndependentBaseUrl);

    const storedIndependentModel = localStorage.getItem('independent_model');
    if (storedIndependentModel) setIndependentModel(storedIndependentModel);

    const storedIndependentMultimodal = localStorage.getItem('independent_multimodal_enabled');
    const storedIndependentMultimodalBool = storedIndependentMultimodal !== null ? storedIndependentMultimodal === 'true' : true;
    if (storedIndependentMultimodal !== null) setIndependentMultimodalEnabled(storedIndependentMultimodalBool);

    const storedIndependentMaxTokens = localStorage.getItem('independent_max_tokens');
    if (storedIndependentMaxTokens) setIndependentMaxTokens(Number(storedIndependentMaxTokens));

    const storedIndependentTemperature = localStorage.getItem('independent_temperature');
    if (storedIndependentTemperature) {
      setIndependentTemperature(Number(storedIndependentTemperature));
    } else {
      setIndependentTemperature(storedIndependentMultimodalBool ? 0.2 : 0.1);
    }

    const storedIndependentFrequencyPenalty = localStorage.getItem('independent_frequency_penalty');
    if (storedIndependentFrequencyPenalty) setIndependentFrequencyPenalty(Number(storedIndependentFrequencyPenalty));

    const storedIndependentTopP = localStorage.getItem('independent_top_p');
    if (storedIndependentTopP) {
      setIndependentTopP(Number(storedIndependentTopP));
    } else {
      setIndependentTopP(storedIndependentMultimodalBool ? 0.8 : 0.1);
    }

    const storedSomEnabled = localStorage.getItem('som_enabled');
    if (storedSomEnabled !== null) {
      setSomEnabled(storedSomEnabled === 'true');
    }

    // Check Cookie for nickname (first time visit judgement)
    const cookieNickname = getCookie('user_nickname');
    if (cookieNickname) {
      setNickname(cookieNickname);
      // Sync to localStorage just in case
      localStorage.setItem('user_nickname', cookieNickname);
    } else {
      // Fallback to localStorage if cookie is missing but localStorage has it (migration)
      const storedNickname = localStorage.getItem('user_nickname');
      if (storedNickname) {
        setNickname(storedNickname);
        setCookie('user_nickname', storedNickname);
      } else {
        setIsWelcomeModalOpen(true);
      }
    }
  }, []);

  useEffect(() => {
    if (deepCollabEnabled && somEnabled) {
      setSomEnabled(false);
      localStorage.setItem('som_enabled', 'false');
      return;
    }
    if (independentModeEnabled && !deepCollabEnabled && !somEnabled) {
      setSomEnabled(true);
      localStorage.setItem('som_enabled', 'true');
    }
  }, [deepCollabEnabled, independentModeEnabled, somEnabled]);

  useEffect(() => {
    if (independentModeEnabled && !isDeepCollabActive) {
      setIsIndependentActive(true);
      return;
    }
    setIsIndependentActive(false);
  }, [independentModeEnabled, isDeepCollabActive]);

  const handleSaveNickname = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setNickname(trimmed);
    localStorage.setItem('user_nickname', trimmed);
    setCookie('user_nickname', trimmed);
    setIsWelcomeModalOpen(false);
  };

  const handleSaveSettings = (settings: { 
    provider: string, 
    key: string, 
    baseUrl?: string, 
    model?: string, 
    restrictedAppsMode: boolean, 
    nickname: string,
    maxSteps: number,
    maxTokens: number,
    temperature: number,
    frequencyPenalty: number,
    deepCollabEnabled: boolean,
    nakoCliEnabled: boolean,
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
  }) => {
    // Save nickname if changed
    const nextNickname = settings.nickname.trim();
    if (nextNickname && nextNickname !== nickname) {
      setNickname(nextNickname);
      localStorage.setItem('user_nickname', nextNickname);
      setCookie('user_nickname', nextNickname);
    }

    const trimmedKey = settings.key.trim();
    setApiKey(trimmedKey);
    localStorage.setItem('zhipu_api_key', trimmedKey);
    
    setApiProvider(settings.provider);
    localStorage.setItem('api_provider', settings.provider);
    
    if (settings.baseUrl !== undefined) {
      const trimmedBaseUrl = settings.baseUrl.trim();
      setBaseUrl(trimmedBaseUrl);
      localStorage.setItem('api_base_url', trimmedBaseUrl);
    }

    if (settings.model !== undefined) {
      const trimmedModel = settings.model.trim();
      setApiModel(trimmedModel);
      localStorage.setItem('api_model', trimmedModel);
    }

    setRestrictedAppsMode(settings.restrictedAppsMode);
    localStorage.setItem('restricted_apps_mode', String(settings.restrictedAppsMode));

    setMaxSteps(settings.maxSteps);
    localStorage.setItem('max_steps', String(settings.maxSteps));

    setMaxTokens(settings.maxTokens);
    localStorage.setItem('max_tokens', String(settings.maxTokens));

    setTemperature(settings.temperature);
    localStorage.setItem('temperature', String(settings.temperature));

    setFrequencyPenalty(settings.frequencyPenalty);
    localStorage.setItem('frequency_penalty', String(settings.frequencyPenalty));

    setNakoCliEnabled(settings.nakoCliEnabled);
    localStorage.setItem('nako_cli_enabled', String(settings.nakoCliEnabled));

    setCollabProvider(settings.collabProvider);
    localStorage.setItem('collab_provider', settings.collabProvider);

    setCollabKey(settings.collabKey);
    localStorage.setItem('collab_key', settings.collabKey);

    if (settings.collabBaseUrl !== undefined) {
      setCollabBaseUrl(settings.collabBaseUrl);
      localStorage.setItem('collab_base_url', settings.collabBaseUrl);
    }

    if (settings.collabModel !== undefined) {
      setCollabModel(settings.collabModel);
      localStorage.setItem('collab_model', settings.collabModel);
    }

    setMultimodalEnabled(settings.multimodalEnabled);
    localStorage.setItem('multimodal_enabled', String(settings.multimodalEnabled));

    setDeepCollabExecutorMaxSteps(settings.deepCollabExecutorMaxSteps);
    localStorage.setItem('deep_collab_executor_max_steps', String(settings.deepCollabExecutorMaxSteps));

    setDeepCollabExecutorMaxTokens(settings.deepCollabExecutorMaxTokens);
    localStorage.setItem('deep_collab_executor_max_tokens', String(settings.deepCollabExecutorMaxTokens));

    setDeepCollabExecutorTemperature(settings.deepCollabExecutorTemperature);
    localStorage.setItem('deep_collab_executor_temperature', String(settings.deepCollabExecutorTemperature));

    setDeepCollabExecutorFrequencyPenalty(settings.deepCollabExecutorFrequencyPenalty);
    localStorage.setItem('deep_collab_executor_frequency_penalty', String(settings.deepCollabExecutorFrequencyPenalty));

    setDeepCollabPlannerMaxTokens(settings.deepCollabPlannerMaxTokens);
    localStorage.setItem('deep_collab_planner_max_tokens', String(settings.deepCollabPlannerMaxTokens));

    setDeepCollabPlannerTemperature(settings.deepCollabPlannerTemperature);
    localStorage.setItem('deep_collab_planner_temperature', String(settings.deepCollabPlannerTemperature));

    setDeepCollabPlannerFrequencyPenalty(settings.deepCollabPlannerFrequencyPenalty);
    localStorage.setItem('deep_collab_planner_frequency_penalty', String(settings.deepCollabPlannerFrequencyPenalty));

    setDeepCollabPlannerTopP(settings.deepCollabPlannerTopP);
    localStorage.setItem('deep_collab_planner_top_p', String(settings.deepCollabPlannerTopP));

    const nextIndependentModeEnabled = settings.independentModeEnabled;
    const nextDeepCollabEnabled = nextIndependentModeEnabled ? false : settings.deepCollabEnabled;
    setIndependentModeEnabled(nextIndependentModeEnabled);
    localStorage.setItem('independent_mode_enabled', String(nextIndependentModeEnabled));
    setDeepCollabEnabled(nextDeepCollabEnabled);
    localStorage.setItem('deep_collab_enabled', String(nextDeepCollabEnabled));
    const nextSomEnabled = nextDeepCollabEnabled ? false : (nextIndependentModeEnabled ? true : settings.somEnabled);
    setSomEnabled(nextSomEnabled);
    localStorage.setItem('som_enabled', String(nextSomEnabled));

    setIndependentProvider(settings.independentProvider);
    localStorage.setItem('independent_provider', settings.independentProvider);

    setIndependentKey(settings.independentKey);
    localStorage.setItem('independent_key', settings.independentKey);

    if (settings.independentBaseUrl !== undefined) {
      setIndependentBaseUrl(settings.independentBaseUrl);
      localStorage.setItem('independent_base_url', settings.independentBaseUrl);
    }

    if (settings.independentModel !== undefined) {
      setIndependentModel(settings.independentModel);
      localStorage.setItem('independent_model', settings.independentModel);
    }

    setIndependentMultimodalEnabled(settings.independentMultimodalEnabled);
    localStorage.setItem('independent_multimodal_enabled', String(settings.independentMultimodalEnabled));

    setIndependentMaxTokens(settings.independentMaxTokens);
    localStorage.setItem('independent_max_tokens', String(settings.independentMaxTokens));

    setIndependentTemperature(settings.independentTemperature);
    localStorage.setItem('independent_temperature', String(settings.independentTemperature));

    setIndependentFrequencyPenalty(settings.independentFrequencyPenalty);
    localStorage.setItem('independent_frequency_penalty', String(settings.independentFrequencyPenalty));

    setIndependentTopP(settings.independentTopP);
    localStorage.setItem('independent_top_p', String(settings.independentTopP));
  };

  // Scrcpy Hook
  const { canvasRef, isConnected, connect, status, deviceModel, videoSize, displaySize, displayInsets, onPointerDown, onPointerMove, onPointerUp, onWheel, onKeyDown, onKeyUp, onCompositionEnd, adbRef } = useScrcpy();
  const { startTask, stopTask, isRunning: isAgentRunning, reset: resetAgentLoop, currentPlan: agentPlan } = useAgentLoop({ canvasRef, isConnected, restrictedAppsMode, adbRef, displaySize, displayInsets });
  const { preheat: preheatDeepCollab, startTask: startDeepCollabTask, stopTask: stopDeepCollabTask, isRunning: isDeepCollabRunning, reset: resetDeepCollabLoop, currentPlan: deepCollabPlan } =
    useDeepCollabLoop({ canvasRef, isConnected, restrictedAppsMode });

  useEffect(() => {
    resetAgentLoop();
    resetDeepCollabLoop();
    setSteps([]);
    setSomOverlayImage(null);
    setSomDebugContent(null);
  }, [currentSessionId, resetAgentLoop, resetDeepCollabLoop]);

  const refreshSoMOverlay = useCallback(async () => {
    const canvas = canvasRef.current;
    const adb = adbRef.current;
    if (!canvas || !adb) return;

    setIsSoMRefreshing(true);
    try {
      const { elements, debug, xmlHead } = await getInteractableElementsWithDebug(
        adb,
        { width: canvas.width, height: canvas.height },
        displaySize ?? null,
        displayInsets ?? null
      );
      const overlay = drawSoMOverlayMask(canvas, elements);
      if (overlay) {
        setSomOverlayImage(overlay);
      }

      const now = new Date();
      const debugText =
        `SoM Debug\n` +
        `Time: ${now.toISOString()}\n` +
        `Canvas: ${canvas.width} x ${canvas.height}\n` +
        `Source: ${debug.sourceWidth} x ${debug.sourceHeight}\n` +
        `XML max: ${debug.maxX} x ${debug.maxY}\n` +
        `Scale: ${debug.scaleX.toFixed(4)} x ${debug.scaleY.toFixed(4)}\n` +
        `Offset: ${debug.offsetX.toFixed(1)} x ${debug.offsetY.toFixed(1)}\n` +
        `Insets: ${debug.insets ? `${debug.insets.left},${debug.insets.top},${debug.insets.right},${debug.insets.bottom}` : 'null'}\n` +
        `Candidates: ${debug.candidateCount}\n` +
        `Elements: ${debug.elementCount}\n` +
        `XML chars: ${debug.xmlChars}\n` +
        `\n--- XML Head (first 4000 chars) ---\n` +
        xmlHead;
      setSomDebugContent(debugText);
    } catch (e: any) {
      const now = new Date();
      const msg = e?.message ?? String(e);
      setSomOverlayImage(drawSoMOverlayMask(canvas, [], 'SoM:ERR'));
      setSomDebugContent(`SoM Debug\nTime: ${now.toISOString()}\nError: ${msg}`);
      throw e;
    } finally {
      setIsSoMRefreshing(false);
    }
  }, [canvasRef, adbRef, displaySize, displayInsets]);

  useEffect(() => {
    if (!somEnabled) return;
    if (!isConnected) return;
    if (isSoMRefreshing) return;
    if (somOverlayImage) return;
    refreshSoMOverlay().catch(() => {});
  }, [somEnabled, isConnected, isSoMRefreshing, somOverlayImage, refreshSoMOverlay]);

  useEffect(() => {
    if (!pendingDeepCollabPreheat) return;
    if (!isConnected) return;
    if (!deepCollabEnabled) return;
    if (!isDeepCollabActive) return;

    setPendingDeepCollabPreheat(false);
    preheatDeepCollab(
      { apiKey, provider: apiProvider, baseUrl, model: apiModel || 'autoglm-phone' },
      { apiKey: collabKey, provider: collabProvider, baseUrl: collabBaseUrl, model: collabModel },
      {
        multimodal: multimodalEnabled,
        executorParams: {
          maxTokens: deepCollabExecutorMaxTokens,
          temperature: deepCollabExecutorTemperature,
          frequencyPenalty: deepCollabExecutorFrequencyPenalty,
          stop: ['</answer>', '<|user|>', 'Observation:'],
        },
        plannerParams: {
          maxTokens: deepCollabPlannerMaxTokens,
          temperature: deepCollabPlannerTemperature,
          frequencyPenalty: deepCollabPlannerFrequencyPenalty,
          topP: deepCollabPlannerTopP,
          responseFormatJson: !multimodalEnabled,
        },
      }
    ).catch((err) => console.error('[DeepCollab] Preheat failed:', err));
  }, [
    pendingDeepCollabPreheat,
    isConnected,
    deepCollabEnabled,
    isDeepCollabActive,
    preheatDeepCollab,
    apiKey,
    apiProvider,
    baseUrl,
    apiModel,
    collabKey,
    collabProvider,
    collabBaseUrl,
    collabModel,
    multimodalEnabled,
    deepCollabExecutorMaxTokens,
    deepCollabExecutorTemperature,
    deepCollabExecutorFrequencyPenalty,
    deepCollabPlannerMaxTokens,
    deepCollabPlannerTemperature,
    deepCollabPlannerFrequencyPenalty,
    deepCollabPlannerTopP,
  ]);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length !== 0) return prev;
      return [
        {
          id: '1',
          role: 'assistant',
          content: 'Web-AutoGLM 已就绪。请点击右侧 "连接设备" 开始，或输入您的 API Key。',
          timestamp: Date.now(),
        },
      ];
    });
  }, [currentSessionId, setMessages]);
  
  const isThinking = isAgentRunning || isDeepCollabRunning;
  const currentChatTitle = sessions.find((s) => s.id === currentSessionId)?.title ?? '新对话';
  const activePlan = isDeepCollabActive ? deepCollabPlan : agentPlan;

  const formatAction = (action: any): string => {
    switch (action.type) {
      case 'click': return `点击位置 ${JSON.stringify(action.params)}`;
      case 'double_click': return `双击位置 ${JSON.stringify(action.params)}`;
      case 'long_press': return `长按位置 ${JSON.stringify(action.params)}`;
      case 'swipe': return `滑动屏幕 ${JSON.stringify(action.params)}`;
      case 'input': return `输入文本 "${action.params[0]}"`;
      case 'launch': return `打开应用 "${action.params[0]}"`;
      case 'back': return '返回上一页';
      case 'home': return '返回桌面';
      case 'wait': return `等待 ${action.params[0]} 秒`;
      case 'finish': return '任务完成';
      case 'take_over': return '请求人工接管';
      default: return `${action.type} ${JSON.stringify(action.params)}`;
    }
  };

  // 发送消息处理
  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');

    const useIndependent = Boolean(independentModeEnabled && isIndependentActive);
    const normalizedInput = input.trim().toLowerCase();
    if (useIndependent && normalizedInput === 'ping') {
      const modelName = independentModel || '独立模式';
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `pong！模型：${modelName}`,
          timestamp: Date.now(),
          senderName: '超大猫猫',
          senderAvatar: '/BigModel_Cat.png',
          model: modelName,
        },
      ]);
      return;
    }

    if (!isConnected) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '请先连接 Android 设备以执行此操作。',
          timestamp: Date.now(),
        },
      ]);
      return;
    }

    const effectiveApiKey = useIndependent ? independentKey : apiKey;

    if (!effectiveApiKey) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: useIndependent ? '请先在设置中填写独立模式 API Key。' : '请先在设置中填写 API Key。',
          timestamp: Date.now(),
        },
      ]);
      return;
    }

    // Reset steps for new task
    setSteps([]);

    try {
      if (deepCollabEnabled && isDeepCollabActive) {
        const senderName = '大猫猫';
        const senderAvatar = multimodalEnabled ? '/BigModel_Cat_star.png' : '/BigModel_Cat.png';

        await startDeepCollabTask(
          newMessage.content,
          { apiKey, provider: apiProvider, baseUrl, model: apiModel || 'autoglm-phone' },
          { apiKey: collabKey, provider: collabProvider, baseUrl: collabBaseUrl, model: collabModel },
          {
            multimodal: multimodalEnabled,
            maxSteps: deepCollabExecutorMaxSteps,
            executorParams: {
              maxTokens: deepCollabExecutorMaxTokens,
              temperature: deepCollabExecutorTemperature,
              frequencyPenalty: deepCollabExecutorFrequencyPenalty,
              stop: ['</answer>', '<|user|>', 'Observation:'],
            },
            plannerParams: {
              maxTokens: deepCollabPlannerMaxTokens,
              temperature: deepCollabPlannerTemperature,
              frequencyPenalty: deepCollabPlannerFrequencyPenalty,
              topP: deepCollabPlannerTopP,
              responseFormatJson: !multimodalEnabled,
            },
            onStep: ({ step, action, planner }) => {
              const actionDesc = formatAction(action);
              const plannerAction = planner ? `${planner.tool} ${JSON.stringify(planner.args || [])}` : '';
              const plannerReply = planner?.thought || (planner?.tool?.toLowerCase?.() === 'finish' ? String(planner?.args?.[0] ?? '') : '');
              const executorReply = action.type === 'finish' ? String(action.params[0] || '任务完成') : (action.thought || '');

              setSteps(prev => {
                const completedSteps = prev.map(s => ({ ...s, status: 'completed' as const }));
                return [
                  ...completedSteps,
                  {
                    id: step,
                    title: actionDesc,
                    status: 'current' as const,
                  },
                ];
              });

              const plannerSection = planner
                ? `【大猫猫规划】\n${planner.thought || ''}\n\n【调用工具】\n${planner.tool} ${JSON.stringify(planner.args || [])}\n\n`
                : '';
              const thoughtSection = action.thought ? `【思考过程】\n${action.thought}\n\n` : '';
              const actionSection = action.type !== 'finish' ? `【执行动作】\n${actionDesc}` : `【回复】\n${action.params[0] || '任务完成'}`;
              const raw = (planner?.raw || action.raw) ? `\n\n【原始数据】\n${planner?.raw || action.raw}` : '';
              const rawContent = `${plannerSection}${thoughtSection}${actionSection}${raw}`;

              setMessages(prev => [
                ...prev,
                {
                  id: `${Date.now()}-${step}`,
                  role: 'assistant',
                  content: plannerReply || (plannerAction ? `调用工具：${plannerAction}` : ''),
                  timestamp: Date.now(),
                  rawContent,
                  step: `步骤 ${step + 1}`,
                  senderName,
                  senderAvatar,
                  model: collabModel,
                  collab: {
                    plannerAction,
                    executorReply,
                    executorAction: actionDesc,
                    executorActionType: action.type,
                    executorName: '小猫猫',
                    executorAvatar: '/Orange_GLMCat.png',
                    executorModel: 'AutoGLM',
                  },
                },
              ]);
            },
          }
        );
      } else {
        const config = useIndependent
          ? { apiKey: independentKey, provider: independentProvider, baseUrl: independentBaseUrl, model: independentModel }
          : { apiKey, provider: apiProvider, baseUrl, model: apiModel };

        const somActive = useIndependent ? true : somEnabled;
        await startTask(newMessage.content, config, {
          maxSteps,
          maxTokens: useIndependent ? independentMaxTokens : maxTokens,
          temperature: useIndependent ? independentTemperature : temperature,
          frequencyPenalty: useIndependent ? independentFrequencyPenalty : frequencyPenalty,
          topP: useIndependent ? independentTopP : undefined,
          mode: useIndependent ? 'independent' : 'normal',
          som: {
            enabled: somActive,
            onPullingChange: setIsSoMRefreshing,
            onOverlay: setSomOverlayImage,
          },
          onStep: ({ step, action }) => {
            const actionDesc = formatAction(action);
            
            setSteps(prev => {
              const completedSteps = prev.map(s => ({ ...s, status: 'completed' as const }));
              return [
                ...completedSteps,
                {
                  id: step,
                  title: actionDesc,
                  status: 'current' as const
                }
              ];
            });
            
            const thoughtSection = action.thought ? `【思考过程】\n${action.thought}\n\n` : '';
            const actionSection = action.type !== 'finish' ? `【执行动作】\n${actionDesc}` : `【回复】\n${action.params[0] || '任务完成'}`;
            const raw = action.raw ? `\n\n【原始数据】\n${action.raw}` : '';

            const displayModel = useIndependent ? (independentModel || '独立模式') : 'AutoGLM';
            const displayName = useIndependent ? '超大猫猫' : undefined;
            const displayAvatar = useIndependent ? '/BigModel_Cat.png' : undefined;

            setMessages(prev => [
              ...prev,
              {
                id: `${Date.now()}-${step}`,
                role: 'assistant',
                content: `${thoughtSection}${actionSection}${raw}`,
                timestamp: Date.now(),
                actionType: action.type,
                step: `步骤 ${step + 1}`,
                model: displayModel,
                senderName: displayName,
                senderAvatar: displayAvatar,
              },
            ]);
          },
        });
      }
    } catch (e: any) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: `执行失败：${e?.message ?? String(e)}`,
          timestamp: Date.now(),
        },
      ]);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#f4f7f9] dark:bg-[#171717] text-[#1a1a1a] dark:text-gray-200 overflow-hidden font-sans selection:bg-orange-500/30">
      <WelcomeModal 
        isOpen={isWelcomeModalOpen} 
        onSave={handleSaveNickname} 
      />
      <Sidebar 
        sessions={sessions}
        currentSessionId={currentSessionId}
        onNewChat={createSession}
        onSwitchSession={switchSession}
        onDeleteSession={deleteSession}
        nickname={nickname || undefined}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      <main className="flex-1 flex overflow-hidden p-3 gap-3">
        <ChatPanel 
          messages={messages}
          input={input}
          isThinking={isThinking}
          steps={steps}
          pipCanvasRef={canvasRef}
          pipChatTitle={currentChatTitle}
          pipIsConnected={isConnected}
          pipDeviceModel={deviceModel}
          onInputChange={setInput}
          onSend={handleSend}
          onStop={() => {
            if (deepCollabEnabled && isDeepCollabActive) {
              stopDeepCollabTask();
            } else {
              stopTask();
            }
          }}
          apiKey={apiKey}
          apiProvider={apiProvider}
          baseUrl={baseUrl}
          apiModel={apiModel}
          onSaveSettings={handleSaveSettings}
          onDeleteChat={() => deleteSession(currentSessionId)}
          onNewChat={createSession}
          adb={adbRef.current}
          nickname={nickname || undefined}
          maxSteps={maxSteps}
          maxTokens={maxTokens}
          temperature={temperature}
          frequencyPenalty={frequencyPenalty}
        nakoCliEnabled={nakoCliEnabled}
          deepCollabEnabled={deepCollabEnabled}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        isDevicePanelCollapsed={isDevicePanelCollapsed}
        onToggleDevicePanel={() => setIsDevicePanelCollapsed(prev => !prev)}
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
          somLoading={isSoMRefreshing}
          isSettingsOpen={isSettingsOpen}
          onCloseSettings={() => setIsSettingsOpen(false)}
          isDeepCollabActive={isDeepCollabActive}
          onToggleDeepCollabActive={(next) => {
            setIsDeepCollabActive(next);
            if (next) setIsIndependentActive(false);
            if (next && deepCollabEnabled) {
              if (!isConnected) {
                setPendingDeepCollabPreheat(true);
                return;
              }
              preheatDeepCollab(
                { apiKey, provider: apiProvider, baseUrl, model: apiModel || 'autoglm-phone' },
                { apiKey: collabKey, provider: collabProvider, baseUrl: collabBaseUrl, model: collabModel },
                {
                  multimodal: multimodalEnabled,
                  executorParams: {
                    maxTokens: deepCollabExecutorMaxTokens,
                    temperature: deepCollabExecutorTemperature,
                    frequencyPenalty: deepCollabExecutorFrequencyPenalty,
                    stop: ['</answer>', '<|user|>', 'Observation:'],
                  },
                  plannerParams: {
                    maxTokens: deepCollabPlannerMaxTokens,
                    temperature: deepCollabPlannerTemperature,
                    frequencyPenalty: deepCollabPlannerFrequencyPenalty,
                    topP: deepCollabPlannerTopP,
                    responseFormatJson: !multimodalEnabled,
                  },
                }
              ).catch((err) => console.error('[DeepCollab] Preheat failed:', err));
            }
          }}
          isIndependentActive={isIndependentActive}
          onToggleIndependentActive={(next) => {
            setIsIndependentActive(next);
            if (next) setIsDeepCollabActive(false);
          }}
          activeAssistantName={independentModeEnabled && isIndependentActive ? '超大猫猫' : (deepCollabEnabled && isDeepCollabActive ? '大猫猫' : undefined)}
          activeAssistantAvatar={independentModeEnabled && isIndependentActive ? '/BigModel_Cat.png' : (deepCollabEnabled && isDeepCollabActive ? (multimodalEnabled ? '/BigModel_Cat_star.png' : '/BigModel_Cat.png') : undefined)}
        />
        <DevicePanel
          isConnected={isConnected}
          onConnect={connect}
          messages={messages}
          canvasRef={canvasRef}
          status={status}
          deviceModel={deviceModel}
          videoSize={videoSize}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onWheel={onWheel}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          onCompositionEnd={onCompositionEnd}
          adbClient={adbRef.current}
          somEnabled={somEnabled}
          somOverlayImage={somOverlayImage}
          isSoMRefreshing={isSoMRefreshing}
          onRefreshSoM={refreshSoMOverlay}
          somDebugContent={somDebugContent}
          isCollapsed={isDevicePanelCollapsed}
        />
      </main>
    </div>
  );
}
