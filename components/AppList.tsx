import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { ChevronRight, Zap, RefreshCw, Loader2 } from 'lucide-react';
import { Adb } from '@yume-chan/adb';
import { DeviceController } from '@/lib/device-control';
import { APP_PACKAGES } from '../config/app-list';

/**
 * AppCard 组件
 * @param {string} name - 应用名称
 * @param {string} packageName - 应用包名
 * @param {React.ReactNode} icon - 应用图标（可选）
 * @param {() => void} onClick - 点击回调
 */
const AppCard = ({ name, packageName, icon, onClick }: { name: string, packageName: string, icon?: React.ReactNode, onClick?: () => void }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div 
      onClick={onClick}
      className="group cursor-pointer bg-white rounded-2xl p-4 flex items-center space-x-4 w-full shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)] border border-gray-50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)] mb-3"
    >
      {/* 左侧：应用图标 (32x32) */}
      <div className="flex-shrink-0">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-inner overflow-hidden ${imgError ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-white'}`}>
          {!imgError ? (
            <Image
              src={`/app-icons/${packageName}.png`}
              alt={name}
              width={32}
              height={32}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            icon || <Zap size={18} className="text-white fill-current" />
          )}
        </div>
      </div>

      {/* 右侧：文字信息 */}
      <div className="flex-grow min-w-0 text-left">
        <h3 className="text-sm font-bold text-gray-800 truncate leading-tight">
          {name}
        </h3>
        <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">
          {packageName}
        </p>
      </div>

      {/* 右侧操作按钮/箭头 */}
      <div className="flex-shrink-0 text-gray-300 group-hover:text-gray-400 transition-colors">
        <ChevronRight size={16} />
      </div>
    </div>
  );
};

interface AppListProps {
  adb: Adb | null;
  isConnected: boolean;
}

interface AppInfo {
  name: string;
  packageName: string;
}

export default function AppList({ adb, isConnected }: AppListProps) {
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deviceController = useMemo(() => {
    return adb ? new DeviceController(adb) : null;
  }, [adb]);

  const fetchApps = useCallback(async () => {
    if (!deviceController || !isConnected) return;
    
    setLoading(true);
    setError(null);
    try {
      const installedPackages = await deviceController.getInstalledApps();
      const installedSet = new Set(installedPackages);
      
      const supportedApps: AppInfo[] = [];
      const seenPackages = new Set<string>();

      // 遍历支持的应用列表，匹配已安装的应用
      for (const [name, pkg] of Object.entries(APP_PACKAGES)) {
        if (installedSet.has(pkg) && !seenPackages.has(pkg)) {
          supportedApps.push({ name, packageName: pkg });
          seenPackages.add(pkg);
        }
      }
      
      setApps(supportedApps);
    } catch (err) {
      console.error('Failed to fetch apps:', err);
      setError('获取应用列表失败');
    } finally {
      setLoading(false);
    }
  }, [deviceController, isConnected]);

  useEffect(() => {
    if (isConnected && deviceController) {
      void fetchApps();
    } else {
      setApps([]);
    }
  }, [isConnected, deviceController, fetchApps]);

  const handleLaunchApp = async (pkg: string, name: string) => {
    if (!deviceController) return;
    try {
      await deviceController.launchApp(pkg);
    } catch (e) {
      console.error(`启动应用 ${name} 失败:`, e);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
        <p className="text-xs">请先连接设备以查看应用列表</p>
      </div>
    );
  }

  if (loading && apps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <Loader2 size={24} className="animate-spin mb-2 text-blue-500" />
        <p className="text-xs">正在加载应用列表...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <p className="text-xs text-red-500 mb-2">{error}</p>
        <button 
          onClick={fetchApps}
          className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600"
        >
          <RefreshCw size={12} /> 重试
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
       <div className="flex-none px-4 py-2 flex justify-between items-center bg-slate-50 border-b border-gray-100/50">
          <span className="text-xs text-gray-500 font-medium">已安装 ({apps.length})</span>
          <button 
            onClick={fetchApps} 
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200/50 rounded-full transition-colors"
            title="刷新列表"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
       </div>
       
       <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {apps.length === 0 ? (
            <div className="text-center text-gray-400 py-8 text-xs">
              未找到支持的应用
            </div>
          ) : (
            apps.map((app) => (
              <AppCard 
                key={app.packageName}
                name={app.name}
                packageName={app.packageName}
                onClick={() => handleLaunchApp(app.packageName, app.name)}
              />
            ))
          )}
          
          <div className="h-8" /> {/* Bottom padding */}
       </div>
    </div>
  );
}
