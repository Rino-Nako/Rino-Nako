import React, { useState, useEffect } from 'react';
import { 
  User, 
  Settings, 
  Cpu, 
  Cloud, 
  Shield, 
  Info, 
  ChevronDown, 
  X,
  Check,
  HardDrive,
  AlertTriangle,
  Lock,
  Server,
  Keyboard,
  Download,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plug,
  Terminal,
  Github,
  Coffee,
  Zap,
  Beaker
} from 'lucide-react';
import { Adb } from '@yume-chan/adb';
import { installAdbKeyboard } from '@/lib/device/input-manager';
import { ABOUT_CONFIG } from '@/config/about';
import { HIDEEX_FUNCTION, HIDE_BETAFUN, HIDE_CLOUDSYNC } from '@/config/feature-flags';
import ImageCropper from './ImageCropper';
import { useTheme } from '@/context/ThemeContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  apiProvider?: string;
  baseUrl?: string;
  apiModel?: string;
  restrictedAppsMode?: boolean;
  deepCollabEnabled?: boolean;
  nakoCliEnabled?: boolean;
  maxSteps?: number;
  maxTokens?: number;
  temperature?: number;
  frequencyPenalty?: number;
  nickname?: string;
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

  onSave: (settings: { 
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
  adb?: Adb | null;
}

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  apiKey, 
  apiProvider = 'zhipu', 
  baseUrl = '', 
  apiModel = '',
  restrictedAppsMode = true,
  deepCollabEnabled = false,
  nakoCliEnabled = false,
  maxSteps: initialMaxSteps = 30,
  maxTokens: initialMaxTokens = 3000,
  temperature: initialTemperature = 0.1,
  frequencyPenalty: initialFrequencyPenalty = 0.2,
  nickname = '',
  collabProvider: initialCollabProvider = 'openai',
  collabKey: initialCollabKey = '',
  collabBaseUrl: initialCollabBaseUrl = '',
  collabModel: initialCollabModel = '',
  multimodalEnabled: initialMultimodalEnabled = false,
  deepCollabExecutorMaxSteps: initialDeepCollabExecutorMaxSteps,
  deepCollabExecutorMaxTokens: initialDeepCollabExecutorMaxTokens,
  deepCollabExecutorTemperature: initialDeepCollabExecutorTemperature,
  deepCollabExecutorFrequencyPenalty: initialDeepCollabExecutorFrequencyPenalty,
  deepCollabPlannerMaxTokens: initialDeepCollabPlannerMaxTokens,
  deepCollabPlannerTemperature: initialDeepCollabPlannerTemperature,
  deepCollabPlannerFrequencyPenalty: initialDeepCollabPlannerFrequencyPenalty,
  deepCollabPlannerTopP: initialDeepCollabPlannerTopP,
  independentModeEnabled: initialIndependentModeEnabled = false,
  independentProvider: initialIndependentProvider = 'openai',
  independentKey: initialIndependentKey = '',
  independentBaseUrl: initialIndependentBaseUrl = '',
  independentModel: initialIndependentModel = '',
  independentMultimodalEnabled: initialIndependentMultimodalEnabled = true,
  independentMaxTokens: initialIndependentMaxTokens = 1024,
  independentTemperature: initialIndependentTemperature,
  independentFrequencyPenalty: initialIndependentFrequencyPenalty,
  independentTopP: initialIndependentTopP,
  somEnabled: initialSomEnabled = false,
  onSave, 
  adb 
}: SettingsModalProps) {
  const { theme, setTheme } = useTheme();
  // Existing State
  const [key, setKey] = useState(apiKey);
  const [provider, setProvider] = useState(apiProvider);
  const [url, setUrl] = useState(baseUrl);
  const [model, setModel] = useState(apiModel);
  const [restrictedMode, setRestrictedMode] = useState(restrictedAppsMode);
  const [maxSteps, setMaxSteps] = useState(initialMaxSteps);
  const [maxTokens, setMaxTokens] = useState(initialMaxTokens);
  const [temperature, setTemperature] = useState(initialTemperature);
  const [frequencyPenalty, setFrequencyPenalty] = useState(initialFrequencyPenalty);
  const [name, setName] = useState(nickname);
  const [independentMode, setIndependentMode] = useState(initialIndependentModeEnabled);
  const [independentProvider, setIndependentProvider] = useState(initialIndependentProvider);
  const [independentKey, setIndependentKey] = useState(initialIndependentKey);
  const [independentBaseUrl, setIndependentBaseUrl] = useState(initialIndependentBaseUrl);
  const [independentModel, setIndependentModel] = useState(initialIndependentModel);
  const [independentMultimodal, setIndependentMultimodal] = useState(initialIndependentMultimodalEnabled);
  const [independentMaxTokens, setIndependentMaxTokens] = useState(initialIndependentMaxTokens);
  const [independentTemperature, setIndependentTemperature] = useState(
    initialIndependentTemperature ?? (initialIndependentMultimodalEnabled ? 0.2 : 0.1)
  );
  const [independentFrequencyPenalty, setIndependentFrequencyPenalty] = useState(
    initialIndependentFrequencyPenalty ?? 0.0
  );
  const [independentTopP, setIndependentTopP] = useState(
    initialIndependentTopP ?? (initialIndependentMultimodalEnabled ? 0.8 : 0.1)
  );
  const [somEnabled, setSomEnabled] = useState(initialSomEnabled);
  
  const [installStatus, setInstallStatus] = useState<'idle' | 'installing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Avatar State
  const [avatar, setAvatar] = useState<string | null>(null);
  const [croppingImage, setCroppingImage] = useState<string | null>(null);

  // New UI State
  const [activeTab, setActiveTab] = useState('user');
  // AI Settings State (Deep Collab)
  const [deepCollab, setDeepCollab] = useState(deepCollabEnabled);
  const [collabProvider, setCollabProvider] = useState(initialCollabProvider);
  const [collabKey, setCollabKey] = useState(initialCollabKey);
  const [collabBaseUrl, setCollabBaseUrl] = useState(initialCollabBaseUrl);
  const [collabModel, setCollabModel] = useState(initialCollabModel);
  const [multimodal, setMultimodal] = useState(initialMultimodalEnabled);
  const [deepCollabExecutorMaxSteps, setDeepCollabExecutorMaxSteps] = useState(
    initialDeepCollabExecutorMaxSteps ?? 120
  );
  const [deepCollabExecutorMaxTokens, setDeepCollabExecutorMaxTokens] = useState(
    initialDeepCollabExecutorMaxTokens ?? 256
  );
  const [deepCollabExecutorTemperature, setDeepCollabExecutorTemperature] = useState(
    initialDeepCollabExecutorTemperature ?? 0.0
  );
  const [deepCollabExecutorFrequencyPenalty, setDeepCollabExecutorFrequencyPenalty] = useState(
    initialDeepCollabExecutorFrequencyPenalty ?? 1.1
  );
  const [deepCollabPlannerMaxTokens, setDeepCollabPlannerMaxTokens] = useState(
    initialDeepCollabPlannerMaxTokens ?? 1024
  );
  const [deepCollabPlannerTemperature, setDeepCollabPlannerTemperature] = useState(
    initialDeepCollabPlannerTemperature ?? (initialMultimodalEnabled ? 0.2 : 0.1)
  );
  const [deepCollabPlannerFrequencyPenalty, setDeepCollabPlannerFrequencyPenalty] = useState(
    initialDeepCollabPlannerFrequencyPenalty ?? 0.0
  );
  const [deepCollabPlannerTopP, setDeepCollabPlannerTopP] = useState(
    initialDeepCollabPlannerTopP ?? (initialMultimodalEnabled ? 0.8 : 0.1)
  );

  // Plugin/CLI State
  const [nakoCli, setNakoCli] = useState(nakoCliEnabled);

  // Skip initial render for auto-save
  const isMounted = React.useRef(false);

  useEffect(() => {
    setKey(apiKey);
    setProvider(apiProvider);
    setUrl(baseUrl);
    setModel(apiModel);
    setRestrictedMode(restrictedAppsMode);
    setDeepCollab(deepCollabEnabled);
    setNakoCli(nakoCliEnabled);
    setMaxSteps(initialMaxSteps);
    setMaxTokens(initialMaxTokens);
    setTemperature(initialTemperature);
    setFrequencyPenalty(initialFrequencyPenalty);
    setName(nickname);
    setCollabProvider(initialCollabProvider);
    setCollabKey(initialCollabKey);
    setCollabBaseUrl(initialCollabBaseUrl);
    setCollabModel(initialCollabModel);
    setMultimodal(initialMultimodalEnabled);
    setDeepCollabExecutorMaxSteps(initialDeepCollabExecutorMaxSteps ?? 120);
    setDeepCollabExecutorMaxTokens(initialDeepCollabExecutorMaxTokens ?? 256);
    setDeepCollabExecutorTemperature(initialDeepCollabExecutorTemperature ?? 0.0);
    setDeepCollabExecutorFrequencyPenalty(initialDeepCollabExecutorFrequencyPenalty ?? 1.1);
    setDeepCollabPlannerMaxTokens(initialDeepCollabPlannerMaxTokens ?? 1024);
    setDeepCollabPlannerTemperature(initialDeepCollabPlannerTemperature ?? (initialMultimodalEnabled ? 0.2 : 0.1));
    setDeepCollabPlannerFrequencyPenalty(initialDeepCollabPlannerFrequencyPenalty ?? 0.0);
    setDeepCollabPlannerTopP(initialDeepCollabPlannerTopP ?? (initialMultimodalEnabled ? 0.8 : 0.1));
    setIndependentMode(initialIndependentModeEnabled);
    setIndependentProvider(initialIndependentProvider);
    setIndependentKey(initialIndependentKey);
    setIndependentBaseUrl(initialIndependentBaseUrl);
    setIndependentModel(initialIndependentModel);
    setIndependentMultimodal(initialIndependentMultimodalEnabled);
    setIndependentMaxTokens(initialIndependentMaxTokens);
    setIndependentTemperature(initialIndependentTemperature ?? (initialIndependentMultimodalEnabled ? 0.2 : 0.1));
    setIndependentFrequencyPenalty(initialIndependentFrequencyPenalty ?? 0.0);
    setIndependentTopP(initialIndependentTopP ?? (initialIndependentMultimodalEnabled ? 0.8 : 0.1));
    setSomEnabled(initialSomEnabled);
  }, [apiKey, apiProvider, baseUrl, apiModel, restrictedAppsMode, deepCollabEnabled, nakoCliEnabled, initialMaxSteps, initialMaxTokens, initialTemperature, initialFrequencyPenalty, nickname, initialCollabProvider, initialCollabKey, initialCollabBaseUrl, initialCollabModel, initialMultimodalEnabled, initialDeepCollabExecutorMaxSteps, initialDeepCollabExecutorMaxTokens, initialDeepCollabExecutorTemperature, initialDeepCollabExecutorFrequencyPenalty, initialDeepCollabPlannerMaxTokens, initialDeepCollabPlannerTemperature, initialDeepCollabPlannerFrequencyPenalty, initialDeepCollabPlannerTopP, initialIndependentModeEnabled, initialIndependentProvider, initialIndependentKey, initialIndependentBaseUrl, initialIndependentModel, initialIndependentMultimodalEnabled, initialIndependentMaxTokens, initialIndependentTemperature, initialIndependentFrequencyPenalty, initialIndependentTopP, initialSomEnabled, isOpen]);

  useEffect(() => {
    if (!deepCollab) return;
    setDeepCollabPlannerTemperature(multimodal ? 0.2 : 0.1);
    setDeepCollabPlannerTopP(multimodal ? 0.8 : 0.1);
  }, [deepCollab, multimodal]);

  useEffect(() => {
    if (!independentMode) return;
    setIndependentTemperature(independentMultimodal ? 0.2 : 0.1);
    setIndependentTopP(independentMultimodal ? 0.8 : 0.1);
  }, [independentMode, independentMultimodal]);

  useEffect(() => {
    if (deepCollab && somEnabled) {
      setSomEnabled(false);
    }
  }, [deepCollab, somEnabled]);

  useEffect(() => {
    if (independentMode && !somEnabled) {
      setSomEnabled(true);
    }
  }, [independentMode, somEnabled]);

  // Reset status when modal opens
  useEffect(() => {
    if (isOpen) {
      setInstallStatus('idle');
      setErrorMessage('');
    }
  }, [isOpen]);

  // Auto-save effect
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    const timer = setTimeout(() => {
      onSave({ 
        provider, 
        key, 
        baseUrl: url, 
        model, 
        restrictedAppsMode: restrictedMode, 
        deepCollabEnabled: deepCollab,
        nakoCliEnabled: nakoCli,
        nickname: name,
        maxSteps,
        maxTokens,
        temperature,
        frequencyPenalty,
        collabProvider,
        collabKey,
        collabBaseUrl,
        collabModel,
        multimodalEnabled: multimodal,
        deepCollabExecutorMaxSteps,
        deepCollabExecutorMaxTokens,
        deepCollabExecutorTemperature,
        deepCollabExecutorFrequencyPenalty,
        deepCollabPlannerMaxTokens,
        deepCollabPlannerTemperature,
        deepCollabPlannerFrequencyPenalty,
        deepCollabPlannerTopP,
        independentModeEnabled: independentMode,
        independentProvider,
        independentKey,
        independentBaseUrl,
        independentModel,
        independentMultimodalEnabled: independentMultimodal,
        independentMaxTokens,
        independentTemperature,
        independentFrequencyPenalty,
        independentTopP,
        somEnabled
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [
    provider, 
    key, 
    url, 
    model, 
    restrictedMode, 
    deepCollab,
    nakoCli,
    name,
    maxSteps,
    maxTokens,
    temperature,
    frequencyPenalty,
    collabProvider,
    collabKey,
    collabBaseUrl,
    collabModel,
    multimodal,
    deepCollabExecutorMaxSteps,
    deepCollabExecutorMaxTokens,
    deepCollabExecutorTemperature,
    deepCollabExecutorFrequencyPenalty,
    deepCollabPlannerMaxTokens,
    deepCollabPlannerTemperature,
    deepCollabPlannerFrequencyPenalty,
    deepCollabPlannerTopP,
    independentMode,
    independentProvider,
    independentKey,
    independentBaseUrl,
    independentModel,
    independentMultimodal,
    independentMaxTokens,
    independentTemperature,
    independentFrequencyPenalty,
    independentTopP,
    somEnabled,
    onSave
  ]);

  // Load avatar from localStorage
  useEffect(() => {
    const savedAvatar = localStorage.getItem('user_avatar');
    if (savedAvatar) {
      setAvatar(savedAvatar);
    }
  }, []);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCroppingImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      e.target.value = ''; // Reset input
    }
  };

  const handleCropConfirm = (croppedImage: string) => {
    setAvatar(croppedImage);
    localStorage.setItem('user_avatar', croppedImage);
    window.dispatchEvent(new Event('avatarUpdated'));
    setCroppingImage(null);
  };

  const handleInstallKeyboard = async () => {
    if (!adb) return;
    
    setInstallStatus('installing');
    setErrorMessage('');
    
    try {
      await installAdbKeyboard(adb);
      setInstallStatus('success');
    } catch (e: any) {
      console.error('Installation failed:', e);
      setInstallStatus('error');
      setErrorMessage(e.message || '安装失败，请检查设备连接');
    }
  };

  if (!isOpen) return null;

  // Menu Items
  const menuItems = [
    { id: 'user', label: '用户', icon: User },
    { id: 'general', label: '常规', icon: Settings },
    { id: 'ai', label: 'AI', icon: Cpu },
    { id: 'cloud', label: '云', icon: Cloud },
    { id: 'plugins', label: '插件', icon: Plug },
    { id: 'security', label: '安全', icon: Shield },
    { id: 'experiment', label: '实验', icon: Beaker },
    { id: 'about', label: '关于', icon: Info },
  ].filter(item => {
    if (item.id === 'plugins' && HIDEEX_FUNCTION) return false;
    if (item.id === 'experiment' && HIDE_BETAFUN) return false;
    if (item.id === 'cloud' && HIDE_CLOUDSYNC) return false;
    return true;
  });

  return (
    <>
      {croppingImage && (
        <ImageCropper 
          imageSrc={croppingImage}
          onCrop={handleCropConfirm}
          onCancel={() => setCroppingImage(null)}
        />
      )}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/20 dark:bg-black/50 backdrop-blur-sm font-sans animate-in fade-in duration-200">
        <div className="bg-white dark:bg-[#1E1E1E] w-full max-w-[850px] h-[650px] max-h-[90vh] rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden border border-gray-200 dark:border-[#2A2A2A] ring-1 ring-black/5 animate-in zoom-in-95 duration-200">
          
          {/* --- Sidebar (Left) --- */}
        <div className="flex flex-col md:w-[240px] bg-gray-50 dark:bg-[#171717] border-b md:border-b-0 md:border-r border-gray-200 dark:border-[#2A2A2A] shrink-0">
          
          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#2A2A2A] bg-gray-50 dark:bg-[#171717]">
            <span className="font-medium text-gray-900 dark:text-gray-200">设置</span>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-200 dark:hover:bg-[#2A2A2A] rounded-lg text-gray-500 dark:text-gray-400 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:flex items-center h-16 px-5">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-200">设置</h2>
          </div>

          {/* Tab List */}
          <div className="flex-1 overflow-x-auto md:overflow-y-auto scrollbar-hide p-2 space-y-1 flex md:flex-col gap-1 md:gap-0">
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group whitespace-nowrap md:whitespace-normal
                    ${isActive 
                      ? 'bg-gray-200 dark:bg-[#2A2A2A] text-gray-900 dark:text-white' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] hover:text-gray-900 dark:hover:text-gray-200'
                    }
                  `}
                >
                  <Icon size={18} className={isActive ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* --- Main Content Area --- */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#1E1E1E] relative">
          
          {/* Desktop Content Header */}
          <header className="hidden md:flex items-center justify-between px-6 h-16 shrink-0 border-b border-gray-100 dark:border-[#2A2A2A]">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-200">
              {menuItems.find(i => i.id === activeTab)?.label}
            </h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                aria-label="关闭"
              >
                <X size={20} />
              </button>
            </div>
          </header>

          {/* Content Scroll Area */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-[#333333]">
            
            {/* 1. USER PANEL */}
            {activeTab === 'user' && (
              <div className="space-y-6 animate-fade-in">
                <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2">管理您的用户账户和记忆</p>
                
                {/* User Profile Card */}
                <div className="flex items-center gap-4 p-4 border border-gray-200 dark:border-[#2A2A2A] rounded-xl hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-colors group relative">
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#171717] flex items-center justify-center overflow-hidden shrink-0 border border-gray-100 dark:border-[#2A2A2A] relative group-hover:border-gray-300 dark:group-hover:border-gray-500 transition-colors">
                    {avatar ? (
                      <img 
                        src={avatar} 
                        alt="avatar" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img 
                        src={`https://api.dicebear.com/9.x/glass/svg?seed=${name || 'User'}`}
                        alt="avatar" 
                        className="w-full h-full object-cover"
                      />
                    )}
                    <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <span className="text-white text-xs font-medium">更换</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleAvatarUpload}
                      />
                    </label>
                  </div>
                  <div className="flex-1 min-w-0">
                    <InputField 
                      label="用户昵称" 
                      value={name} 
                      onChange={(e: any) => setName(e.target.value)} 
                      placeholder="输入你的昵称"
                    />
                  </div>
                </div>

                {/* Memory Management */}
                <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-[#2A2A2A]">
                  <div>
                    <div className="text-gray-900 dark:text-gray-200 text-sm font-medium">记忆</div>
                    <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">管理在深度协作下模型的记忆</div>
                  </div>
                  <button className="px-4 py-2 bg-white dark:bg-[#171717] border border-gray-300 dark:border-[#333333] rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-colors shadow-sm">
                    管理
                  </button>
                </div>
              </div>
            )}

            {/* 2. GENERAL PANEL */}
            {activeTab === 'general' && (
              <div className="space-y-6 animate-fade-in">
                <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2">常规的设置和选项</p>
                
                {/* Display Style */}
                <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-[#2A2A2A]">
                  <div className="pr-4">
                    <div className="text-gray-900 dark:text-gray-200 text-sm font-medium">显示样式</div>
                    <div className="text-gray-500 dark:text-gray-400 text-xs mt-1 leading-relaxed">切换应用程序的外观主题</div>
                  </div>
                  <div className="w-40">
                    <SelectField
                      label=""
                      value={theme}
                      onChange={(e: any) => setTheme(e.target.value)}
                      options={[
                        { value: 'light', label: '浅色' },
                        { value: 'dark', label: '深色' },
                        { value: 'system', label: '跟随系统' }
                      ]}
                    />
                  </div>
                </div>

                {/* Restrict Actions */}
                <div className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-[#2A2A2A]">
                  <div className="pr-4">
                    <div className="text-gray-900 dark:text-gray-200 text-sm font-medium">操作部分限制应用</div>
                    <div className="text-gray-500 dark:text-gray-400 text-xs mt-1 leading-relaxed">开启后，将启用对特定应用的操作限制提示</div>
                  </div>
                  <ToggleSwitch 
                    checked={restrictedMode} 
                    onChange={() => setRestrictedMode(!restrictedMode)} 
                  />
                </div>

                {/* ADB Keyboard (Moved from old UI) */}
                <div className="bg-gray-50 dark:bg-[#171717] rounded-xl p-4 border border-gray-200 dark:border-[#2A2A2A]">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white dark:bg-[#2A2A2A] rounded-lg border border-gray-200 dark:border-[#333333] text-orange-500">
                      <Keyboard size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-200">ADB Keyboard</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                        安装 ADB Keyboard 输入法以支持更快速、准确的中文输入。安装后会自动设为默认输入法。
                      </p>
                      
                      <div className="mt-3">
                        {installStatus === 'idle' && (
                          <button
                            onClick={handleInstallKeyboard}
                            disabled={!adb}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              adb 
                                ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
                                : 'bg-gray-100 dark:bg-[#2A2A2A] text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            <Download size={14} />
                            {adb ? '安装到设备' : '请先连接设备'}
                          </button>
                        )}

                        {installStatus === 'installing' && (
                          <div className="flex items-center gap-2 text-xs text-orange-600 font-medium">
                            <Loader2 size={14} className="animate-spin" />
                            正在安装并设置...
                          </div>
                        )}

                        {installStatus === 'success' && (
                          <div className="flex items-center gap-2 text-xs text-green-600 font-medium">
                            <CheckCircle size={14} />
                            安装成功！已启用 ADB Keyboard
                          </div>
                        )}

                        {installStatus === 'error' && (
                          <div className="flex items-center gap-2 text-xs text-red-600 font-medium">
                            <AlertCircle size={14} />
                            {errorMessage}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. AI PANEL */}
            {activeTab === 'ai' && (
              <div className="space-y-8 animate-fade-in">
                <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2">设置 AI 服务提供商</p>
                {independentMode && (
                  <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 text-xs text-orange-700 dark:text-orange-400">
                    独立模式已开启，操作手机 API 设置将被禁用。
                  </div>
                )}
                <div className={independentMode ? 'opacity-50 pointer-events-none' : ''}>
                  <div className="space-y-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-200">操作手机 API 提供商</div>
                    <div className="bg-gray-50 dark:bg-[#171717] p-4 rounded-xl border border-gray-200 dark:border-[#2A2A2A] space-y-4">
                      <SelectField 
                        label="提供商" 
                        value={provider} 
                        onChange={(e: any) => setProvider(e.target.value)}
                        options={[
                          { value: 'zhipu', label: 'Zhipu AI' },
                          { value: 'openai', label: 'OpenAI Compatible' }
                        ]}
                      />
                      
                      {provider === 'zhipu' ? (
                        <InputField 
                          label="Zhipu API Key" 
                          type="password" 
                          placeholder="sk-..." 
                          value={key}
                          onChange={(e: any) => setKey(e.target.value)}
                        />
                      ) : (
                        <div className="space-y-3">
                          <InputField 
                            label="API Key" 
                            type="password" 
                            placeholder="sk-..." 
                            value={key}
                            onChange={(e: any) => setKey(e.target.value)}
                          />
                          <InputField 
                            label="Base URL" 
                            type="text" 
                            placeholder="https://api.openai.com/v1" 
                            value={url}
                            onChange={(e: any) => setUrl(e.target.value)}
                          />
                          <InputField 
                            label="Model Name" 
                            type="text" 
                            placeholder="gpt-4-turbo" 
                            value={model}
                            onChange={(e: any) => setModel(e.target.value)}
                          />
                        </div>
                      )}
                      
                      <div className="text-[10px] text-gray-400 dark:text-gray-500">
                        Your API key will be stored locally in your browser.
                      </div>
                    </div>
                  </div>

                  {!deepCollab ? (
                    <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-[#2A2A2A]">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-200">模型参数设置</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">设置模型的参数，建议专业人士调试使用。</div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <InputField 
                          label="最大操作次数 (Max Steps)" 
                          type="number" 
                          placeholder="50" 
                          value={maxSteps}
                          onChange={(e: any) => setMaxSteps(Number(e.target.value))}
                        />
                        <InputField 
                          label="最大输出 Token (Max Tokens)" 
                          type="number" 
                          placeholder="4096" 
                          value={maxTokens}
                          onChange={(e: any) => setMaxTokens(Number(e.target.value))}
                        />
                        <InputField 
                          label="采样温度 (Temperature)" 
                          type="number" 
                          placeholder="0.7" 
                          step="0.1" 
                          value={temperature}
                          onChange={(e: any) => setTemperature(Number(e.target.value))}
                        />
                        <InputField 
                          label="频率惩罚 (Frequency Penalty)" 
                          type="number" 
                          placeholder="0.0" 
                          step="0.1" 
                          value={frequencyPenalty}
                          onChange={(e: any) => setFrequencyPenalty(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="pt-4 border-t border-gray-100 dark:border-[#2A2A2A]">
                      <div className="text-xs text-gray-500 dark:text-gray-400">深度协作开启时，模型参数请在实验页面配置。</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. CLOUD PANEL */}
            {activeTab === 'cloud' && (
              <div className="space-y-6 animate-fade-in">
                <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2">将您的用户账户数据存储到云服务提供商以在多个设备之间同步。</p>

                <div className="grid gap-4">
                  <CloudButton 
                    title="OneDrive" 
                    description="连接 OneDrive 保存你的数据" 
                    bgClass="bg-blue-50 dark:bg-blue-900/20"
                    icon={
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="35.98 139.2 648.03 430.85" className="w-8 h-8">
                        {/* SVG Content Omitted for brevity, will be preserved */}
                        <defs>
                          <radialGradient id="od-radial0" gradientUnits="userSpaceOnUse" cx="0" cy="0" fx="0" fy="0" r="1" gradientTransform="matrix(130.864814,156.804864,-260.089994,217.063603,48.669602,228.766494)">
                            <stop offset="0" stopColor="rgb(28.235294%,58.039216%,99.607843%)" stopOpacity="1"/>
                            <stop offset="0.695072" stopColor="rgb(3.529412%,20.392157%,70.196078%)" stopOpacity="1"/>
                          </radialGradient>
                          <radialGradient id="od-radial1" gradientUnits="userSpaceOnUse" cx="0" cy="0" fx="0" fy="0" r="1" gradientTransform="matrix(-575.289668,663.594003,-491.728488,-426.294267,596.956501,-6.380235)">
                            <stop offset="0.165327" stopColor="rgb(13.72549%,75.294118%,99.607843%)" stopOpacity="1"/>
                            <stop offset="0.534" stopColor="rgb(10.980392%,56.862745%,100%)" stopOpacity="1"/>
                          </radialGradient>
                          <radialGradient id="od-radial2" gradientUnits="userSpaceOnUse" cx="0" cy="0" fx="0" fy="0" r="1" gradientTransform="matrix(-136.753383,-114.806698,262.816935,-313.057562,181.196995,240.395994)">
                            <stop offset="0" stopColor="rgb(100%,100%,100%)" stopOpacity="0.4"/>
                            <stop offset="0.660528" stopColor="rgb(67.843137%,75.294118%,100%)" stopOpacity="0"/>
                          </radialGradient>
                          <radialGradient id="od-radial3" gradientUnits="userSpaceOnUse" cx="0" cy="0" fx="0" fy="0" r="1" gradientTransform="matrix(-153.638428,-130.000063,197.433014,-233.332948,375.353994,451.43549)">
                            <stop offset="0" stopColor="rgb(1.176471%,22.745098%,80%)" stopOpacity="1"/>
                            <stop offset="1" stopColor="rgb(21.176471%,55.686275%,100%)" stopOpacity="0"/>
                          </radialGradient>
                          <radialGradient id="od-radial4" gradientUnits="userSpaceOnUse" cx="0" cy="0" fx="0" fy="0" r="1" gradientTransform="matrix(175.585899,405.198026,-437.434522,189.555055,169.378495,125.589294)">
                            <stop offset="0.592618" stopColor="rgb(20.392157%,39.215686%,89.019608%)" stopOpacity="0"/>
                            <stop offset="1" stopColor="rgb(1.176471%,22.745098%,80%)" stopOpacity="0.6"/>
                          </radialGradient>
                          <radialGradient id="od-radial5" gradientUnits="userSpaceOnUse" cx="0" cy="0" fx="0" fy="0" r="1" gradientTransform="matrix(-459.329491,459.329491,-719.614455,-719.614455,589.876499,39.484649)">
                            <stop offset="0" stopColor="rgb(29.411765%,99.215686%,90.980392%)" stopOpacity="0.898039"/>
                            <stop offset="0.543937" stopColor="rgb(29.411765%,99.215686%,90.980392%)" stopOpacity="0"/>
                          </radialGradient>
                          <linearGradient id="od-linear0" gradientUnits="userSpaceOnUse" x1="29.999701" y1="37.9823" x2="29.999701" y2="18.398199" gradientTransform="matrix(15,0,0,15,0,0)">
                            <stop offset="0" stopColor="rgb(0%,52.54902%,100%)" stopOpacity="1"/>
                            <stop offset="0.49" stopColor="rgb(0%,73.333333%,100%)" stopOpacity="1"/>
                          </linearGradient>
                          <radialGradient id="od-radial6" gradientUnits="userSpaceOnUse" cx="0" cy="0" fx="0" fy="0" r="1" gradientTransform="matrix(273.622108,108.513684,-205.488428,518.148261,296.488495,307.441492)">
                            <stop offset="0" stopColor="rgb(100%,100%,100%)" stopOpacity="0.4"/>
                            <stop offset="0.785262" stopColor="rgb(100%,100%,100%)" stopOpacity="0"/>
                          </radialGradient>
                          <radialGradient id="od-radial7" gradientUnits="userSpaceOnUse" cx="0" cy="0" fx="0" fy="0" r="1" gradientTransform="matrix(-305.683909,263.459223,-264.352324,-306.720147,674.845505,249.378004)">
                            <stop offset="0" stopColor="rgb(29.411765%,99.215686%,90.980392%)" stopOpacity="0.898039"/>
                            <stop offset="0.584724" stopColor="rgb(29.411765%,99.215686%,90.980392%)" stopOpacity="0"/>
                          </radialGradient>
                        </defs>
                        <g id="surface1">
                          <path style={{stroke: 'none', fillRule: 'nonzero', fill: 'url(#od-radial0)'}} d="M 215.078125 205.089844 C 116.011719 205.09375 41.957031 286.1875 36.382812 376.527344 C 39.835938 395.992188 51.175781 434.429688 68.941406 432.457031 C 91.144531 429.988281 147.066406 432.457031 194.765625 346.105469 C 229.609375 283.027344 301.285156 205.085938 215.078125 205.089844 Z M 215.078125 205.089844 "/>
                          <path style={{stroke: 'none', fillRule: 'nonzero', fill: 'url(#od-radial1)'}} d="M 192.171875 238.8125 C 158.871094 291.535156 114.042969 367.085938 98.914062 390.859375 C 80.929688 419.121094 33.304688 407.113281 37.25 366.609375 C 36.863281 369.894531 36.5625 373.210938 36.355469 376.546875 C 29.84375 481.933594 113.398438 569.453125 217.375 569.453125 C 331.96875 569.453125 605.269531 426.671875 577.609375 283.609375 C 548.457031 199.519531 466.523438 139.203125 373.664062 139.203125 C 280.808594 139.203125 221.296875 192.699219 192.171875 238.8125 Z M 192.171875 238.8125 "/>
                          <path style={{stroke: 'none', fillRule: 'nonzero', fill: 'url(#od-radial2)'}} d="M 192.171875 238.8125 C 158.871094 291.535156 114.042969 367.085938 98.914062 390.859375 C 80.929688 419.121094 33.304688 407.113281 37.25 366.609375 C 36.863281 369.894531 36.5625 373.210938 36.355469 376.546875 C 29.84375 481.933594 113.398438 569.453125 217.375 569.453125 C 331.96875 569.453125 605.269531 426.671875 577.609375 283.609375 C 548.457031 199.519531 466.523438 139.203125 373.664062 139.203125 C 280.808594 139.203125 221.296875 192.699219 192.171875 238.8125 Z M 192.171875 238.8125 "/>
                          <path style={{stroke: 'none', fillRule: 'nonzero', fill: 'url(#od-radial3)'}} d="M 192.171875 238.8125 C 158.871094 291.535156 114.042969 367.085938 98.914062 390.859375 C 80.929688 419.121094 33.304688 407.113281 37.25 366.609375 C 36.863281 369.894531 36.5625 373.210938 36.355469 376.546875 C 29.84375 481.933594 113.398438 569.453125 217.375 569.453125 C 331.96875 569.453125 605.269531 426.671875 577.609375 283.609375 C 548.457031 199.519531 466.523438 139.203125 373.664062 139.203125 C 280.808594 139.203125 221.296875 192.699219 192.171875 238.8125 Z M 192.171875 238.8125 "/>
                          <path style={{stroke: 'none', fillRule: 'nonzero', fill: 'url(#od-radial4)'}} d="M 192.171875 238.8125 C 158.871094 291.535156 114.042969 367.085938 98.914062 390.859375 C 80.929688 419.121094 33.304688 407.113281 37.25 366.609375 C 36.863281 369.894531 36.5625 373.210938 36.355469 376.546875 C 29.84375 481.933594 113.398438 569.453125 217.375 569.453125 C 331.96875 569.453125 605.269531 426.671875 577.609375 283.609375 C 548.457031 199.519531 466.523438 139.203125 373.664062 139.203125 C 280.808594 139.203125 221.296875 192.699219 192.171875 238.8125 Z M 192.171875 238.8125 "/>
                          <path style={{stroke: 'none', fillRule: 'nonzero', fill: 'url(#od-radial5)'}} d="M 192.171875 238.8125 C 158.871094 291.535156 114.042969 367.085938 98.914062 390.859375 C 80.929688 419.121094 33.304688 407.113281 37.25 366.609375 C 36.863281 369.894531 36.5625 373.210938 36.355469 376.546875 C 29.84375 481.933594 113.398438 569.453125 217.375 569.453125 C 331.96875 569.453125 605.269531 426.671875 577.609375 283.609375 C 548.457031 199.519531 466.523438 139.203125 373.664062 139.203125 C 280.808594 139.203125 221.296875 192.699219 192.171875 238.8125 Z M 192.171875 238.8125 "/>
                          <path style={{stroke: 'none', fillRule: 'nonzero', fill: 'url(#od-linear0)'}} d="M 215.699219 569.496094 C 215.699219 569.496094 489.320312 570.035156 535.734375 570.035156 C 619.960938 570.035156 684 501.273438 684 421.03125 C 684 340.789062 618.671875 272.445312 535.734375 272.445312 C 452.792969 272.445312 405.027344 334.492188 369.152344 402.226562 C 327.117188 481.59375 273.488281 568.546875 215.699219 569.496094 Z M 215.699219 569.496094 "/>
                          <path style={{stroke: 'none', fillRule: 'nonzero', fill: 'url(#od-radial6)'}} d="M 215.699219 569.496094 C 215.699219 569.496094 489.320312 570.035156 535.734375 570.035156 C 619.960938 570.035156 684 501.273438 684 421.03125 C 684 340.789062 618.671875 272.445312 535.734375 272.445312 C 452.792969 272.445312 405.027344 334.492188 369.152344 402.226562 C 327.117188 481.59375 273.488281 568.546875 215.699219 569.496094 Z M 215.699219 569.496094 "/>
                          <path style={{stroke: 'none', fillRule: 'nonzero', fill: 'url(#od-radial7)'}} d="M 215.699219 569.496094 C 215.699219 569.496094 489.320312 570.035156 535.734375 570.035156 C 619.960938 570.035156 684 501.273438 684 421.03125 C 684 340.789062 618.671875 272.445312 535.734375 272.445312 C 452.792969 272.445312 405.027344 334.492188 369.152344 402.226562 C 327.117188 481.59375 273.488281 568.546875 215.699219 569.496094 Z M 215.699219 569.496094 "/>
                        </g>
                      </svg>
                    }
                  />
                  <CloudButton 
                    title="Google Drive" 
                    description="连接 Google Drive 保存你的数据" 
                    bgClass="bg-green-50 dark:bg-green-900/20"
                    icon={
                      <svg viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
                        <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                        <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
                        <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                        <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                        <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                        <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                      </svg>
                    }
                  />
                </div>
              </div>
            )}

            {/* 5. PLUGINS PANEL */}
            {activeTab === 'plugins' && (
              <div className="space-y-6 animate-fade-in">
                <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2">为 Nako 安装合适的插件，以提升 Nako 的运行效率</p>

                {/* Nako CLI Card */}
                <div className="bg-gray-50 dark:bg-[#171717] rounded-xl p-4 border border-gray-200 dark:border-[#2A2A2A]">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white dark:bg-[#2A2A2A] rounded-lg border border-gray-200 dark:border-[#333333] text-gray-700 dark:text-gray-300">
                      <Terminal size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-200">了解 Nako CLI</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                        Nako CLI 是 Rino Nako 的命令行版本，他拥有心跳机制，可以 24 小时运行并自动完成任务，同时为您的隐私保护设计
                      </p>
                      
                      {/* Connection Toggle */}
                      <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-200/60 dark:border-[#2A2A2A]">
                         <div className="text-xs font-medium text-gray-700 dark:text-gray-300">连接 Nako CLI</div>
                         <ToggleSwitch 
                           checked={nakoCli} 
                           onChange={() => {
                             // Request permission logic would go here
                             if (!nakoCli) {
                               // Simulate permission request or just toggle for now as per "目前就这样即可"
                             }
                             setNakoCli(!nakoCli);
                           }} 
                         />
                      </div>
                      
                      {/* Install Button */}
                      <div className="mt-3">
                        <button 
                          className="w-full py-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg text-xs font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                          onClick={() => window.open('https://github.com/RinoNako/Nako-CLI', '_blank')}
                        >
                          <Download size={14} />
                          安装 Nako CLI
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-[#171717] rounded-xl p-4 border border-gray-200 dark:border-[#2A2A2A]">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white dark:bg-[#2A2A2A] rounded-lg border border-gray-200 dark:border-[#333333] text-gray-700 dark:text-gray-300">
                      <Zap size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-200">Nako Relay</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                        使用此辅助工具可以在 Nako Web 中使您本地连接至本地部署的 API
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 6. SECURITY PANEL */}
            {activeTab === 'security' && (
              <div className="space-y-6 animate-fade-in">
                <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2">了解您的数据是如何被使用的</p>
                
                {/* Promise Card */}
                <div className="bg-gray-50 dark:bg-[#171717] border border-gray-200 dark:border-[#2A2A2A] rounded-xl p-5">
                  <h3 className="font-medium text-gray-900 dark:text-gray-200 mb-4 flex items-center gap-2">
                    Rino Nako 对您的承诺
                  </h3>
                  <div className="space-y-4">
                    <SecurityItem text="您的隐私安全对我们来说至关重要" icon={Shield} color="text-blue-600 dark:text-blue-400" />
                    <SecurityItem text="您的数据不会离开您的私密设备和您选择的云服务提供商" icon={Lock} color="text-blue-600 dark:text-blue-400" />
                    <SecurityItem text="您的数据不会被我们用于 AI 的训练" icon={Server} color="text-blue-600 dark:text-blue-400" />
                    <SecurityItem text="您的数据会与您本地的浏览器存储和 Cookie 保存" icon={HardDrive} color="text-blue-600 dark:text-blue-400" />
                    <SecurityItem text="您登入我们的平台后我们只保存您的云服务提供商的凭据以便同步" icon={User} color="text-blue-600 dark:text-blue-400" />
                  </div>
                </div>

                {/* Warning Card */}
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-5">
                  <h3 className="font-medium text-orange-900 dark:text-orange-200 mb-4 flex items-center gap-2">
                    您可能需要注意
                  </h3>
                  <div className="space-y-4">
                    <SecurityItem text="您的 API 提供商可能会利用您的数据训练模型" icon={AlertTriangle} color="text-orange-600 dark:text-orange-400" textColor="text-orange-800 dark:text-orange-300" />
                    <SecurityItem text="您的 API Key 可能会与您本人产生绑定" icon={User} color="text-orange-600 dark:text-orange-400" textColor="text-orange-800 dark:text-orange-300" />
                    <SecurityItem text="请保护好您的个人数据。" icon={Info} color="text-orange-600 dark:text-orange-400" textColor="text-orange-800 dark:text-orange-300" />
                  </div>
                </div>
              </div>
            )}

            {/* 7. EXPERIMENT PANEL */}
            {activeTab === 'experiment' && (
              <div className="space-y-6 animate-fade-in h-full flex flex-col">
                <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2">这里的功能为实验性功能。</p>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-200">独立模式</div>
                    <ToggleSwitch 
                      checked={independentMode} 
                      onChange={() => {
                        const next = !independentMode;
                        setIndependentMode(next);
                        if (next) setDeepCollab(false);
                      }} 
                    />
                  </div>

                  {independentMode && (
                    <div className="bg-gray-50 dark:bg-[#171717] p-4 rounded-xl border border-gray-200 dark:border-[#2A2A2A] space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center justify-between border-b border-gray-200/60 dark:border-[#2A2A2A] pb-3 mb-2">
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300">多模态模型</div>
                        <ToggleSwitch 
                          checked={independentMultimodal} 
                          onChange={() => setIndependentMultimodal(!independentMultimodal)} 
                        />
                      </div>
                      <div className="text-xs text-orange-600 dark:text-orange-400">默认要求使用多模态模型</div>
                      <SelectField 
                        label="提供商" 
                        value={independentProvider} 
                        onChange={(e: any) => setIndependentProvider(e.target.value)}
                        options={[
                          { value: 'openai', label: 'OpenAI Compatible' },
                          { value: 'claude', label: 'Claude' },
                          { value: 'gemini', label: 'Gemini' }
                        ]}
                      />

                      <div className="space-y-3">
                        {independentProvider === 'openai' ? (
                          <>
                            <InputField 
                              label="API Key" 
                              type="password" 
                              placeholder="sk-..." 
                              value={independentKey}
                              onChange={(e: any) => setIndependentKey(e.target.value)}
                            />
                            <InputField 
                              label="Base URL" 
                              type="text" 
                              placeholder="https://api.openai.com/v1" 
                              value={independentBaseUrl}
                              onChange={(e: any) => setIndependentBaseUrl(e.target.value)}
                            />
                            <InputField 
                              label="Model Name" 
                              type="text" 
                              placeholder="gpt-4" 
                              value={independentModel}
                              onChange={(e: any) => setIndependentModel(e.target.value)}
                            />
                          </>
                        ) : (
                          <>
                            <InputField 
                              label="API Key" 
                              type="password" 
                              placeholder="sk-..." 
                              value={independentKey}
                              onChange={(e: any) => setIndependentKey(e.target.value)}
                            />
                            {independentProvider === 'gemini' && (
                              <InputField 
                                label="Base URL" 
                                type="text" 
                                placeholder="https://generativelanguage.googleapis.com/v1beta" 
                                value={independentBaseUrl}
                                onChange={(e: any) => setIndependentBaseUrl(e.target.value)}
                              />
                            )}
                            <InputField 
                              label="Model Name" 
                              type="text" 
                              placeholder="model-name" 
                              value={independentModel}
                              onChange={(e: any) => setIndependentModel(e.target.value)}
                            />
                          </>
                        )}
                      </div>

                      <div className="text-[10px] text-gray-400 dark:text-gray-500">
                        Your API key will be stored locally in your browser.
                      </div>

                      <div className="pt-4 border-t border-gray-200/60 dark:border-[#2A2A2A] space-y-4">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-200">大模型参数设置</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">根据多模态开关自动设置默认值，可手动调整。</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <InputField
                            label="最大输出 Token (Max Tokens)"
                            type="number"
                            placeholder="1024"
                            value={independentMaxTokens}
                            onChange={(e: any) => setIndependentMaxTokens(Math.max(1, Number(e.target.value)))}
                          />
                          <InputField
                            label="采样温度 (Temperature)"
                            type="number"
                            step="0.1"
                            placeholder={independentMultimodal ? '0.2' : '0.1'}
                            value={independentTemperature}
                            onChange={(e: any) => setIndependentTemperature(Number(e.target.value))}
                          />
                          <InputField
                            label="频率惩罚 (Frequency Penalty)"
                            type="number"
                            step="0.1"
                            placeholder="0.0"
                            value={independentFrequencyPenalty}
                            onChange={(e: any) => setIndependentFrequencyPenalty(Number(e.target.value))}
                          />
                          <InputField
                            label="top_p"
                            type="number"
                            step="0.1"
                            placeholder={independentMultimodal ? '0.8' : '0.1'}
                            value={independentTopP}
                            onChange={(e: any) => setIndependentTopP(Number(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-200">SoM (Set-of-Mark)</div>
                    <div className={deepCollab || independentMode ? 'opacity-50 pointer-events-none' : ''}>
                      <ToggleSwitch 
                        checked={somEnabled} 
                        onChange={() => setSomEnabled(!somEnabled)} 
                      />
                    </div>
                  </div>
                  {independentMode && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">独立模式开启时将自动启用</div>
                  )}
                  {deepCollab && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">深度协作模式下不可启用</div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-200">深度协作 API 模型提供商</div>
                    <ToggleSwitch 
                      checked={deepCollab} 
                      onChange={() => {
                        const next = !deepCollab;
                        setDeepCollab(next);
                        if (next) {
                          setIndependentMode(false);
                          setSomEnabled(false);
                        }
                      }} 
                    />
                  </div>

                  {deepCollab && (
                    <div className="bg-gray-50 dark:bg-[#171717] p-4 rounded-xl border border-gray-200 dark:border-[#2A2A2A] space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center justify-between border-b border-gray-200/60 dark:border-[#2A2A2A] pb-3 mb-2">
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300">多模态模型</div>
                        <ToggleSwitch 
                          checked={multimodal} 
                          onChange={() => setMultimodal(!multimodal)} 
                        />
                      </div>
                      
                      <SelectField 
                        label="提供商" 
                        value={collabProvider} 
                        onChange={(e: any) => setCollabProvider(e.target.value)}
                        options={[
                          { value: 'openai', label: 'OpenAI Compatible' },
                          { value: 'claude', label: 'Claude' },
                          { value: 'gemini', label: 'Gemini' }
                        ]}
                      />

                      <div className="space-y-3">
                        {collabProvider === 'openai' && (
                          <>
                            <InputField 
                              label="API Key" 
                              type="password" 
                              placeholder="sk-..." 
                              value={collabKey}
                              onChange={(e: any) => setCollabKey(e.target.value)}
                            />
                            <InputField 
                              label="Base URL" 
                              type="text" 
                              placeholder="https://api.openai.com/v1" 
                              value={collabBaseUrl}
                              onChange={(e: any) => setCollabBaseUrl(e.target.value)}
                            />
                            <InputField 
                              label="Model Name" 
                              type="text" 
                              placeholder="gpt-4" 
                              value={collabModel}
                              onChange={(e: any) => setCollabModel(e.target.value)}
                            />
                          </>
                        )}
                        {collabProvider === 'claude' && (
                          <>
                            <InputField 
                              label="Claude Key" 
                              type="password" 
                              placeholder="sk-ant-..." 
                              value={collabKey}
                              onChange={(e: any) => setCollabKey(e.target.value)}
                            />
                            <InputField 
                              label="Model Name" 
                              type="text" 
                              placeholder="claude-3-opus" 
                              value={collabModel}
                              onChange={(e: any) => setCollabModel(e.target.value)}
                            />
                          </>
                        )}
                        {collabProvider === 'gemini' && (
                          <>
                            <InputField 
                              label="Gemini Key" 
                              type="password" 
                              placeholder="AIza..." 
                              value={collabKey}
                              onChange={(e: any) => setCollabKey(e.target.value)}
                            />
                            <InputField 
                              label="Base URL" 
                              type="text" 
                              placeholder="https://generativelanguage.googleapis.com/v1beta" 
                              value={collabBaseUrl}
                              onChange={(e: any) => setCollabBaseUrl(e.target.value)}
                            />
                            <InputField 
                              label="Model Name" 
                              type="text" 
                              placeholder="gemini-pro" 
                              value={collabModel}
                              onChange={(e: any) => setCollabModel(e.target.value)}
                            />
                          </>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-500">
                        Your API key will be stored locally in your browser.
                      </div>

                      <div className="pt-4 border-t border-gray-200/60 dark:border-[#2A2A2A] space-y-4">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-200">GLM 模型参数设置</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">协作模式下用于执行器 (AutoGLM) 的默认参数。</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <InputField
                            label="最大操作次数 (Max Steps)"
                            type="number"
                            placeholder="120"
                            value={deepCollabExecutorMaxSteps}
                            onChange={(e: any) => setDeepCollabExecutorMaxSteps(Math.min(120, Math.max(1, Number(e.target.value))))}
                          />
                          <InputField
                            label="最大输出 Token (Max Tokens)"
                            type="number"
                            placeholder="256"
                            value={deepCollabExecutorMaxTokens}
                            onChange={(e: any) => setDeepCollabExecutorMaxTokens(Math.max(1, Number(e.target.value)))}
                          />
                          <InputField
                            label="采样温度 (Temperature)"
                            type="number"
                            step="0.1"
                            placeholder="0.0"
                            value={deepCollabExecutorTemperature}
                            onChange={(e: any) => setDeepCollabExecutorTemperature(Number(e.target.value))}
                          />
                          <InputField
                            label="频率惩罚 (Frequency Penalty)"
                            type="number"
                            step="0.1"
                            placeholder="1.1"
                            value={deepCollabExecutorFrequencyPenalty}
                            onChange={(e: any) => setDeepCollabExecutorFrequencyPenalty(Number(e.target.value))}
                          />
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-200/60 dark:border-[#2A2A2A] space-y-4">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-200">大模型参数设置</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">根据多模态开关自动设置默认值，可手动调整。</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <InputField
                            label="最大输出 Token (Max Tokens)"
                            type="number"
                            placeholder="1024"
                            value={deepCollabPlannerMaxTokens}
                            onChange={(e: any) => setDeepCollabPlannerMaxTokens(Math.max(1, Number(e.target.value)))}
                          />
                          <InputField
                            label="采样温度 (Temperature)"
                            type="number"
                            step="0.1"
                            placeholder={multimodal ? '0.2' : '0.1'}
                            value={deepCollabPlannerTemperature}
                            onChange={(e: any) => setDeepCollabPlannerTemperature(Number(e.target.value))}
                          />
                          <InputField
                            label="频率惩罚 (Frequency Penalty)"
                            type="number"
                            step="0.1"
                            placeholder="0.0"
                            value={deepCollabPlannerFrequencyPenalty}
                            onChange={(e: any) => setDeepCollabPlannerFrequencyPenalty(Number(e.target.value))}
                          />
                          <InputField
                            label="top_p"
                            type="number"
                            step="0.1"
                            placeholder={multimodal ? '0.8' : '0.1'}
                            value={deepCollabPlannerTopP}
                            onChange={(e: any) => setDeepCollabPlannerTopP(Number(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {!deepCollab && (
                  <div className="flex-1 flex items-center justify-center -mt-10 opacity-50 pointer-events-none">
                    <div className="flex flex-col items-center justify-center text-center p-8">
                       <div className="w-20 h-20 bg-gray-50 dark:bg-[#171717] rounded-full flex items-center justify-center mb-4 text-gray-400 dark:text-gray-500">
                         <Beaker size={40} strokeWidth={1.5} />
                       </div>
                       <h3 className="text-base font-medium text-gray-900 dark:text-gray-200">暂无更多实验板块</h3>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 6. ABOUT PANEL */}
            {activeTab === 'about' && (
              <div className="space-y-6 animate-fade-in pb-6">
                {/* Top Banner Card */}
                <div className="w-full h-48 bg-black rounded-2xl flex flex-col items-center justify-center shadow-lg relative overflow-hidden shrink-0">
                   {/* Background Image */}
                   <img 
                     src="/info_background.png" 
                     alt="Background" 
                     className="absolute inset-0 w-full h-full object-cover opacity-80"
                   />
                   
                   {/* Background Pattern */}
                   <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none z-10">
                      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />
                      </svg>
                   </div>
                   
                   {/* Logo Representation - SVG */}
                   <div className="z-20 text-white flex flex-col items-center gap-4">
                      <svg width="200" height="26" viewBox="0 0 256 33" fill="none" xmlns="http://www.w3.org/2000/svg" className="max-w-[80%] h-auto">
                        <path d="M0 2.28647H15.077C19.1528 2.28647 22.4569 5.64386 22.4569 9.71963C22.4569 13.7369 19.2002 17.0461 15.183 17.0461M26.5231 28.4814H25.7158C21.8526 28.4814 18.406 26.054 17.1045 22.4166L15.183 17.0461M2.69727 30.6387L2.69727 23.4482C2.69727 19.9124 5.5636 17.0461 9.09939 17.0461H15.183" stroke="white" strokeWidth="4.57295"/>
                        <path d="M35.669 11.4324L35.669 30.6387" stroke="white" strokeWidth="4.57295"/>
                        <path d="M31.096 5.03021C34.0457 3.77301 35.8402 3.8491 39.3273 5.03021" stroke="white" strokeWidth="4.57295"/>
                        <rect x="97" y="8.28647" width="21" height="20" rx="10" transform="rotate(90 97 8.28647)" stroke="white" strokeWidth="4.57295"/>
                        <path d="M57.6328 5.48755C64.2058 5.48773 69.5342 10.8159 69.5342 17.3889V31.0959H64.9619V17.3889C64.9619 13.3415 61.6802 10.06 57.6328 10.0598C53.5853 10.0598 50.3037 13.3414 50.3037 17.3889V31.054H45.7315V17.3889C45.7315 10.8158 51.0597 5.48755 57.6328 5.48755Z" fill="white"/>
                        <rect x="253" y="6.28647" width="24" height="22" rx="11" transform="rotate(90 253 6.28647)" stroke="white" strokeWidth="5"/>
                        <path d="M193.527 30.7865V15.7865C193.527 9.71134 188.602 4.78647 182.527 4.78647C176.452 4.78647 171.527 9.71134 171.527 15.7865V16.512C171.527 22.9878 176.777 28.2375 183.253 28.2375H184.527" stroke="white" strokeWidth="5"/>
                        <path d="M193.527 30.7865V15.7865C193.527 9.71134 188.602 4.78647 182.527 4.78647C176.452 4.78647 171.527 9.71134 171.527 15.7865V16.512C171.527 22.9878 176.777 28.2375 183.253 28.2375H184.527" stroke="white" strokeWidth="5"/>
                        <path d="M203.527 4.78647V10.7865" stroke="white" strokeWidth="5"/>
                        <path d="M203.527 24.7865V30.7865" stroke="white" strokeWidth="5"/>
                        <path d="M212.555 17.1576L226.125 31.2865H219.192L207.208 18.808L205.466 16.9945L207.289 15.263L218.849 4.28647H226.11L212.555 17.1576Z" fill="white"/>
                        <path d="M119.797 31.2865H114.093L114 31.2308L123.566 15.2865H129.397L119.797 31.2865Z" fill="white"/>
                        <path d="M140 31.2865L140 12.2865" stroke="white" strokeWidth="5"/>
                        <path d="M161 31.2865L161 2.28647" stroke="white" strokeWidth="5"/>
                        <path d="M163.285 31.2865H157.837L139 2.28647H144.447L163.285 31.2865Z" fill="white"/>
                      </svg>
                   </div>
                </div>

                {/* Background Character Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 px-1">背景角色</h3>
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                     <div className="flex gap-4">
                       <div className="flex-1">
                         <div className="text-sm font-medium text-gray-900 mb-1">{ABOUT_CONFIG.backgroundCharacter.name}</div>
                        <p className="text-xs text-gray-500 leading-relaxed text-justify">
                          {ABOUT_CONFIG.backgroundCharacter.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* About Project Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-200 mb-3 px-1">关于项目</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0 text-gray-500 shadow-sm">
                        <Info size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">版本</div>
                        <div className="text-xs text-gray-500 mt-0.5">{ABOUT_CONFIG.version}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                        <img src={ABOUT_CONFIG.developer.avatar} alt="Developer" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{ABOUT_CONFIG.developer.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{ABOUT_CONFIG.developer.role}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Open Source Section */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-200 mb-3 px-1">开源</h3>
                  <div className="space-y-2">
                    {ABOUT_CONFIG.links.map((link, index) => {
                      const Icon = link.icon;
                      return (
                        <button 
                          key={index}
                          onClick={() => window.open(link.url, '_blank')}
                          className="w-full flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors text-left"
                        >
                          <div className={`w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center shrink-0 shadow-sm ${link.iconColorClass || 'text-gray-700'}`}>
                            <Icon size={20} />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{link.title}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{link.description}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            
          </div>
          
          {/* Mobile Footer with Save - Removed as requested */}
        </div>
      </div>
      </div>
    </>
  );
}

// --- Helper Components ---

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button 
      onClick={onChange}
      className={`
        relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2
        ${checked ? 'bg-blue-600' : 'bg-gray-200 dark:bg-[#333333]'}
      `}
    >
      <span className="sr-only">Toggle</span>
      <span
        aria-hidden="true"
        className={`
          pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
          ${checked ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  );
}

function InputField({ label, type = "text", placeholder, step, value, onChange }: { label: string; type?: string; placeholder?: string; step?: string; value?: string | number; onChange?: (e: any) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      <input 
        type={type} 
        step={step}
        placeholder={placeholder} 
        value={value}
        onChange={onChange}
        className="w-full bg-white dark:bg-[#171717] border border-gray-300 dark:border-[#333333] text-gray-900 dark:text-gray-200 text-sm rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 block p-2.5 outline-none transition-all placeholder-gray-500 dark:placeholder-gray-600"
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (e: any) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      <div className="relative">
        <select 
          value={value}
          onChange={onChange}
          className="w-full bg-white dark:bg-[#171717] border border-gray-300 dark:border-[#333333] text-gray-900 dark:text-gray-200 text-sm rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 block p-2.5 outline-none appearance-none transition-all cursor-pointer"
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-gray-500">
          <ChevronDown size={16} />
        </div>
      </div>
    </div>
  );
}

function CloudButton({ title, description, icon, bgClass }: { title: string; description: string; icon?: React.ReactNode; bgClass?: string }) {
  return (
    <button className="flex items-center gap-4 p-4 border border-gray-200 dark:border-[#333333] rounded-xl hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-colors group w-full text-left">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${bgClass || 'bg-gray-50 dark:bg-[#2A2A2A]'}`}>
        {icon || <Cloud size={24} className="text-gray-400" />}
      </div>
      <div>
        <div className="text-gray-900 dark:text-gray-200 font-medium">{title}</div>
        <div className="text-gray-500 dark:text-gray-400 text-sm">{description}</div>
      </div>
    </button>
  );
}

function SecurityItem({ text, icon: Icon, color, textColor = "text-gray-600" }: { text: string; icon: any; color: string; textColor?: string }) {
  return (
    <div className="flex gap-3 items-start">
      <div className={`mt-0.5 shrink-0 ${color}`}>
        <Icon size={18} />
      </div>
      <p className={`text-sm ${textColor} dark:text-gray-400 leading-relaxed`}>{text}</p>
    </div>
  );
}
