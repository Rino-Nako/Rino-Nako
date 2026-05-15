import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { PanelLeft, PanelRight, Settings, Trash2 } from 'lucide-react';
import { ChatSession } from '@/hooks/useChatSessions';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string;
  onNewChat: () => void;
  onSwitchSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  nickname?: string;
  isOpen?: boolean;
  onToggle?: () => void;
  onOpenSettings?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  onNewChat,
  onSwitchSession,
  onDeleteSession,
  nickname,
  isOpen = true,
  onToggle,
  onOpenSettings
}) => {
  const displayName = nickname?.trim() ? nickname.trim() : 'Guest User';
  const avatarText = displayName ? displayName.slice(0, 1) : 'G';
  
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load avatar from localStorage and listen for updates
  useEffect(() => {
    const loadAvatar = () => {
      const savedAvatar = localStorage.getItem('user_avatar');
      if (savedAvatar) {
        setAvatar(savedAvatar);
      }
    };

    loadAvatar();

    const handleAvatarUpdate = () => {
      loadAvatar();
    };

    window.addEventListener('avatarUpdated', handleAvatarUpdate);
    return () => {
      window.removeEventListener('avatarUpdated', handleAvatarUpdate);
    };
  }, []);

  return (
    <div 
      className={`
        h-screen bg-[#F8FAFC] dark:bg-[#1E1E1E] border-r border-transparent dark:border-[#2A2A2A] flex flex-col hidden md:flex overflow-hidden
        transition-all duration-300 ease-in-out
        ${isOpen ? (isCollapsed ? 'w-16 opacity-100 translate-x-0' : 'w-64 opacity-100 translate-x-0') : 'w-0 opacity-0 -translate-x-full border-none'}
      `}
    >
      <div className="p-3 flex flex-col">
        <div className={`flex items-center w-full mb-4 h-10 ${isCollapsed ? 'justify-center' : 'justify-between px-1'}`}>
          <div className={`transition-all duration-300 overflow-hidden text-[#545454] dark:text-gray-200 ${isCollapsed ? 'w-0 opacity-0' : 'w-[70px] opacity-100'}`}>
            <svg className="w-[70px] h-[30px] shrink-0" viewBox="0 0 108 35" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 2.5H16.4851C20.9414 2.5 24.5541 6.17093 24.5541 10.6273C24.5541 15.0198 20.9933 18.638 16.6008 18.638M29 31.1411H28.1173C23.8934 31.1411 20.1249 28.4871 18.7019 24.51L16.6008 18.638M2.94916 33.5L2.94916 25.638C2.94915 21.772 6.08316 18.638 9.94915 18.638H16.6008" stroke="currentColor" strokeWidth="5"/>
              <path d="M39 12.5L39 33.5" stroke="currentColor" strokeWidth="5"/>
              <path d="M34 5.5C37.2252 4.12539 39.1872 4.20859 43 5.5" stroke="currentColor" strokeWidth="5"/>
              <rect x="105" y="8.5" width="24" height="22" rx="11" transform="rotate(90 105 8.5)" stroke="currentColor" strokeWidth="5"/>
              <path fillRule="evenodd" clipRule="evenodd" d="M63.0146 6C70.2012 6.00026 76.0281 11.8261 76.0283 19.0127V34H71.0283V19.0127C71.0281 14.5875 67.4398 11.0003 63.0146 11C58.5895 11.0002 55.0022 14.5875 55.002 19.0127V33.9541H50.002V19.0127C50.0022 11.8261 55.828 6.00025 63.0146 6Z" fill="currentColor"/>
            </svg>
          </div>
          <div className={`flex items-center gap-1 ${isCollapsed ? '' : 'ml-auto'}`}>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2A2A2A] rounded-lg transition-colors shrink-0"
              title={isCollapsed ? '展开侧边栏' : '折叠侧边栏'}
            >
              {isCollapsed ? <PanelRight size={20} /> : <PanelLeft size={20} />}
            </button>
          </div>
        </div>
        <button 
          onClick={onNewChat}
          className={`flex items-center gap-2 bg-white dark:bg-[#171717] dark:border dark:border-[#2A2A2A] rounded-xl transition-all active:scale-[0.96] shadow-sm hover:shadow-md hover:bg-gray-50 dark:hover:bg-[#2A2A2A] group ${
            isCollapsed ? 'p-2.5 justify-center w-10 h-10' : 'px-4 py-2 w-full'
          }`}
          title="开启新对话"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle-plus-icon lucide-message-circle-plus text-gray-400 dark:text-gray-300"><path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
          <span className={`font-medium text-sm text-gray-700 dark:text-gray-200 whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
            开启新对话
          </span>
        </button>
      </div>
      
      <div className={`flex-1 overflow-y-auto px-2 transition-opacity duration-300 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="px-2 py-3">
          <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-2 px-2">历史记录</h3>
          <div className="space-y-1">
            {sessions.map((session) => (
              <div 
                key={session.id}
                onClick={() => onSwitchSession(session.id)}
                className={`group flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                  session.id === currentSessionId 
                    ? 'bg-gray-200 dark:bg-[#2A2A2A] text-gray-900 dark:text-gray-100 font-medium' 
                    : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] dark:hover:text-gray-200'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden flex-1">
                  <span className="truncate">{session.title}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('确定要删除此对话吗？')) {
                      onDeleteSession(session.id);
                    }
                  }}
                  className={`p-1 rounded hover:bg-gray-300 dark:hover:bg-[#333] text-gray-400 hover:text-red-500 transition-opacity ${
                    session.id === currentSessionId ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                  title="删除对话"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`mt-auto p-3 flex flex-col gap-2 ${isCollapsed ? 'items-center' : ''}`}>
        {isCollapsed ? (
          <>
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="p-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-xl transition-colors"
                title="设置"
              >
                <Settings size={20} />
              </button>
            )}
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs text-white overflow-hidden border border-gray-200 dark:border-[#2A2A2A] dark:bg-[#333]">
              {avatar ? (
                <Image src={avatar} alt="avatar" width={32} height={32} className="w-full h-full object-cover" unoptimized />
              ) : (
                avatarText
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#2A2A2A] transition-all cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-xs text-white overflow-hidden border border-gray-200 dark:border-[#2A2A2A] dark:bg-[#333]">
              {avatar ? (
                <Image src={avatar} alt="avatar" width={32} height={32} className="w-full h-full object-cover" unoptimized />
              ) : (
                avatarText
              )}
            </div>
            <div className="flex-1 overflow-hidden transition-opacity duration-300">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{displayName}</div>
            </div>
            {onOpenSettings && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenSettings();
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#333] hover:text-gray-200 p-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
                title="设置"
              >
                <Settings size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
