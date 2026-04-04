import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Smartphone, Grid, Bug } from 'lucide-react';
import { Message } from '@/types';
import { Adb } from '@yume-chan/adb';
import AppList from './AppList';
import RawDataModal from './RawDataModal';

interface DevicePanelProps {
  isConnected: boolean;
  onConnect: () => void;
  messages: Message[];
  isCollapsed?: boolean;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
  status?: string;
  deviceModel?: string;
  videoSize?: { width: number; height: number } | null;
  onPointerDown?: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerMove?: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onPointerUp?: (e: React.PointerEvent<HTMLCanvasElement>) => void;
  onWheel?: (e: React.WheelEvent<HTMLCanvasElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLCanvasElement>) => void;
  onKeyUp?: (e: React.KeyboardEvent<HTMLCanvasElement>) => void;
  onCompositionEnd?: (e: React.CompositionEvent<HTMLCanvasElement>) => void;
  adbClient?: Adb | null;
  somEnabled?: boolean;
  somOverlayImage?: string | null;
  isSoMRefreshing?: boolean;
  onRefreshSoM?: () => void;
  somDebugContent?: string | null;
}

enum TabType {
  PHONE = 'phone',
  APP = 'app'
}

export default function DevicePanel({ isConnected, onConnect, messages, isCollapsed, canvasRef, status, deviceModel, videoSize, onPointerDown, onPointerMove, onPointerUp, onWheel, onKeyDown, onKeyUp, onCompositionEnd, adbClient, somEnabled, somOverlayImage, isSoMRefreshing, onRefreshSoM, somDebugContent }: DevicePanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>(TabType.PHONE);
  const [isSoMDebugOpen, setIsSoMDebugOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [frameSize, setFrameSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (!videoSize?.width || !videoSize?.height) return;

    const el = containerRef.current;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      const aw = rect.width;
      const ah = rect.height;
      if (!aw || !ah) return;

      const vr = videoSize.width / videoSize.height;
      const ar = aw / ah;

      let width: number;
      let height: number;
      if (ar > vr) {
        height = ah;
        width = height * vr;
      } else {
        width = aw;
        height = width / vr;
      }

      setFrameSize({ width, height });
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [videoSize?.width, videoSize?.height]);

  return (
    <div className={`h-full bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#2A2A2A] flex flex-col shadow-xl rounded-2xl hidden lg:flex z-20 overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 pointer-events-none border-transparent shadow-none' : 'w-[360px] opacity-100'}`}>
      <RawDataModal isOpen={isSoMDebugOpen} onClose={() => setIsSoMDebugOpen(false)} content={somDebugContent || ''} />
      <div className="px-3 py-3 flex items-center justify-between border-b border-gray-100 dark:border-[#2A2A2A] bg-white dark:bg-[#1E1E1E]">
        <div className="flex items-center gap-2">
          <div className="text-xs font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1.5 bg-gray-50 dark:bg-[#171717] px-2 py-1 rounded-md border border-gray-100 dark:border-[#2A2A2A]">
            {deviceModel || '手机型号'}
          </div>
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border transition-colors duration-300 ${
            isConnected ? 'border-green-100 bg-green-50' : 'border-gray-100 dark:border-[#2A2A2A] bg-gray-50 dark:bg-[#171717]'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
              isConnected ? 'bg-green-500' : 'bg-gray-400'
            }`}></span>
            <span className={`text-[10px] transition-colors duration-300 ${
              isConnected ? 'text-green-600' : 'text-gray-500 dark:text-gray-400'
            }`}>
              {isConnected ? '已连接' : '未连接'}
            </span>
          </div>
        </div>
        <div className="flex gap-1 items-center">
          <button
            onClick={() => setActiveTab(TabType.PHONE)}
            title="手机模式"
            className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border transition-colors duration-200 ${
              activeTab === TabType.PHONE
                ? 'bg-gray-100 dark:bg-[#171717] border-gray-200 dark:border-[#2A2A2A] text-gray-900 dark:text-gray-200'
                : 'bg-transparent border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#2A2A2A] hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <Smartphone size={16} />
          </button>
          <button
            onClick={() => setActiveTab(TabType.APP)}
            title="应用列表"
            className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border transition-colors duration-200 ${
              activeTab === TabType.APP
                ? 'bg-gray-100 dark:bg-[#171717] border-gray-200 dark:border-[#2A2A2A] text-gray-900 dark:text-gray-200'
                : 'bg-transparent border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#2A2A2A] hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <Grid size={16} />
          </button>
          {somEnabled && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsSoMDebugOpen(true)}
                title="查看 SoM 调试信息"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-transparent bg-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#2A2A2A] hover:text-gray-900 dark:hover:text-gray-100 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                disabled={!somDebugContent}
              >
                <Bug size={16} />
              </button>
              <button
                onClick={() => onRefreshSoM?.()}
                title="刷新 SoM"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-transparent bg-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#2A2A2A] hover:text-gray-900 dark:hover:text-gray-100 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                disabled={!isConnected || Boolean(isSoMRefreshing)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isSoMRefreshing ? 'animate-spin' : ''}>
                  <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                  <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                  <path d="M16 16h5v5" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-gray-50 dark:bg-[#171717] relative flex items-center justify-center overflow-hidden">
        {!isConnected && (
          <div className="text-center p-8 z-10">
            <div className="w-12 h-12 border-2 border-gray-200 dark:border-[#2A2A2A] border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xs text-gray-400">等待设备连接...</p>
            <button onClick={onConnect} className="mt-4 px-4 py-2 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#2A2A2A] rounded-lg text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2A2A2A] transition-colors">
              点击连接
            </button>
          </div>
        )}
        
        {/* Screen Content / Canvas */}
        <div className={`absolute inset-0 flex items-center justify-center p-4 overflow-hidden ${isConnected && activeTab === TabType.PHONE ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div ref={containerRef} className="w-full h-full min-w-0 min-h-0 flex items-center justify-center">
            <div className="relative" style={{ width: frameSize?.width ?? '100%', height: frameSize?.height ?? '100%' }}>
              <canvas
                ref={canvasRef}
                tabIndex={0}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onWheel={onWheel}
                onKeyDown={onKeyDown}
                onKeyUp={onKeyUp}
                onCompositionEnd={onCompositionEnd}
                onContextMenu={(e) => e.preventDefault()}
                className="w-full h-full shadow-lg rounded-xl border border-gray-200 dark:border-[#2A2A2A]"
              />
              {somEnabled && somOverlayImage && (
                <Image
                  src={somOverlayImage}
                  alt="SoM Overlay"
                  fill
                  sizes="100vw"
                  className="absolute inset-0 w-full h-full pointer-events-none rounded-xl"
                  unoptimized
                />
              )}
            </div>
          </div>
        </div>

        {/* App List */}
        <div className={`absolute inset-0 flex flex-col bg-slate-50 dark:bg-[#171717] ${isConnected && activeTab === TabType.APP ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none'}`}>
            <AppList adb={adbClient || null} isConnected={isConnected} />
        </div>
      </div>
    </div>
  );
}
