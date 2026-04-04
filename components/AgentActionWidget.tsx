import React from 'react';

// -----------------------------------------------------------------------------
// 1. 图标组件 (SVG Icons)
// -----------------------------------------------------------------------------

// Swipe (滑动) - 使用 Hand Icon
const IconSwipe = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2"/>
    <path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"/>
    <path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8"/>
    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>
  </svg>
);

// Click (点击) - 使用 Mouse Pointer 2
const IconClick = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z"/>
  </svg>
);

// Launch (启动应用) - 使用 External Link
const IconLaunch = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
  </svg>
);

// Double Click (双击)
const IconDoubleClick = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12.034 12.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.943l-3.444 1.068a1 1 0 0 0-.66.66l-1.067 3.443a.5.5 0 0 1-.943.033z"/>
    <path d="M5 3a2 2 0 0 0-2 2"/><path d="M19 3a2 2 0 0 1 2 2"/><path d="M5 21a2 2 0 0 1-2-2"/><path d="M9 3h1"/><path d="M9 21h2"/><path d="M14 3h1"/><path d="M3 9v1"/><path d="M21 9v2"/><path d="M3 14v1"/>
  </svg>
);

// Long Press (长按)
const IconLongPress = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12.034 12.681a.498.498 0 0 1 .647-.647l9 3.5a.5.5 0 0 1-.033.943l-3.444 1.068a1 1 0 0 0-.66.66l-1.067 3.443a.5.5 0 0 1-.943.033z"/>
    <path d="M5 17A12 12 0 0 1 17 5"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/>
  </svg>
);

// Wait (等待)
const IconWait = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 6v6l-4 2"/><circle cx="12" cy="12" r="10"/>
  </svg>
);

// Finish (完成)
const IconFinish = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21.801 10A10 10 0 1 1 17 3.335"/><path d="m9 11 3 3L22 4"/>
  </svg>
);

// Take Over (人工接管)
const IconTakeOver = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><path d="M12 16h.01"/>
  </svg>
);

// -----------------------------------------------------------------------------
// 2. 核心控件组件 (The Widget)
// -----------------------------------------------------------------------------

interface AgentActionWidgetProps {
  type: string;
  customText?: string;
}

/**
 * AgentActionWidget
 * @param {string} type - 操作类型
 * @param {string} customText - 可选，覆盖默认文本
 */
const AgentActionWidget: React.FC<AgentActionWidgetProps> = ({ type = 'swipe', customText }) => {
  // 定义状态配置映射
  const config: Record<string, any> = {
    swipe: {
      icon: <IconSwipe />,
      text: "正在划动屏幕...",
      animation: "animate-swipe",
      colorClass: "text-gray-600"
    },
    click: {
      icon: <IconClick />,
      text: "点击屏幕...",
      animation: "animate-tap",
      colorClass: "text-gray-600"
    },
    launch: {
      icon: <IconLaunch />,
      text: "启动应用...",
      animation: "animate-pop-in",
      colorClass: "text-blue-600"
    },
    doubleClick: {
      icon: <IconDoubleClick />,
      text: "双击屏幕...",
      animation: "animate-double-tap",
      colorClass: "text-gray-600"
    },
    longPress: {
      icon: <IconLongPress />,
      text: "长按屏幕...",
      animation: "animate-long-press",
      colorClass: "text-purple-600"
    },
    wait: {
      icon: <IconWait />,
      text: "正在等待...",
      animation: "animate-spin-slow",
      colorClass: "text-amber-600"
    },
    finish: {
      icon: <IconFinish />,
      text: "完成",
      animation: "animate-bounce-once",
      colorClass: "text-green-600"
    },
    takeOver: {
      icon: <IconTakeOver />,
      text: "人工接管",
      animation: "animate-pulse-alert",
      colorClass: "text-red-600"
    }
  };

  // Map incoming raw action types to config keys
  let mappedType = type;
  if (type === 'double_click') mappedType = 'doubleClick';
  if (type === 'long_press') mappedType = 'longPress';
  if (type === 'take_over') mappedType = 'takeOver';
  if (type === 'input') mappedType = 'click'; // Fallback
  if (type === 'home') mappedType = 'click'; // Fallback
  if (type === 'back') mappedType = 'swipe'; // Fallback
  if (type === 'type') mappedType = 'click'; // Fallback

  const currentConfig = config[mappedType] || config.swipe;
  const displayText = customText || currentConfig.text;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F7F7F7] text-gray-700 select-none transition-all duration-300 ease-in-out hover:bg-gray-200 shadow-sm border border-transparent hover:border-gray-300 mb-2">
      {/* 图标容器 */}
      <div className={`flex items-center justify-center w-5 h-5 ${currentConfig.colorClass} ${currentConfig.animation || ''}`}>
        {currentConfig.icon}
      </div>
      
      {/* 文本区域 */}
      <span className={`text-sm font-medium tracking-wide font-sans ${currentConfig.colorClass}`}>
        {displayText}
      </span>

      {/* 状态指示点 */}
      <span className="flex h-2 w-2 relative ml-1">
        {mappedType === 'takeOver' ? (
           <>
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
           </>
        ) : mappedType === 'finish' ? (
           <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        ) : (
           <>
             <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
             <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
           </>
        )}
      </span>
    </div>
  );
};

export default AgentActionWidget;
