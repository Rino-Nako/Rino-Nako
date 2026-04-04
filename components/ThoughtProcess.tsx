import React, { useState } from 'react'; 
import { ChevronDown, Sparkles } from 'lucide-react'; 

/** 
 * ThoughtProcess 组件 
 * @param {string} duration - 思考耗时字符串 (e.g., "12s") 
 * @param {React.ReactNode} children - 思考的具体内容 
 */ 
const ThoughtProcess = ({ duration = "...", children }: { duration?: string, children: React.ReactNode }) => { 
  const [isOpen, setIsOpen] = useState(false); 

  return ( 
    <div className="w-full max-w-3xl my-4"> 
      {/* Header / Trigger Area */} 
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className={` 
          group flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 w-full text-left 
          ${isOpen ? 'bg-white border border-gray-100 shadow-sm' : 'hover:bg-gray-50'} 
        `} 
      > 
        {/* Icon & Label Container */} 
        <div className="flex items-center gap-1.5 flex-1 min-w-0"> 
          {/* Animated Gradient Icon to mimic "AI Thinking" vibe */} 
          <div className={`p-1 rounded-md ${isOpen ? 'bg-orange-50 text-orange-500' : 'text-gray-400 group-hover:text-gray-600'}`}> 
            <Sparkles size={14} className={isOpen ? "animate-pulse" : ""} /> 
          </div> 
          
          <span className={` 
            truncate font-medium transition-colors 
            ${isOpen ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-900'} 
          `}> 
            {isOpen ? '思考过程' : `已思考 ${duration}`} 
          </span> 
        </div> 
        
        {/* Chevron Icon */} 
        <ChevronDown 
          size={16} 
          className={` 
            text-gray-400 transition-transform duration-300 ease-in-out 
            ${isOpen ? 'rotate-180 text-gray-600' : 'group-hover:text-gray-600'} 
          `} 
        /> 
      </button> 

      {/* Expanded Content */} 
      <div 
        className={` 
          grid transition-[grid-template-rows] duration-300 ease-in-out 
          ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'} 
        `} 
      > 
        <div className="overflow-hidden"> 
          <div className="px-3 pb-3 pt-1 ml-2 border-l-2 border-gray-100 my-1"> 
            <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed font-mono text-[13px] bg-gray-50 p-4 rounded-lg whitespace-pre-wrap"> 
              {children} 
            </div> 
          </div> 
        </div> 
      </div> 
    </div> 
  ); 
}; 

export default ThoughtProcess;
