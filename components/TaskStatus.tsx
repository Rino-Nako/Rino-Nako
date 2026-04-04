import React, { useState, useEffect } from 'react'; 
import { 
  Check, 
  RotateCcw, 
  ChevronDown 
} from 'lucide-react'; 

export interface TaskStep {
  id: string | number;
  title: string;
  status: 'pending' | 'current' | 'completed';
}

interface TaskStatusProps {
  steps: TaskStep[];
  isRunning: boolean;
  onRestart?: () => void;
  className?: string;
}

const TaskStatus = ({ steps, isRunning, onRestart, className = '' }: TaskStatusProps) => { 
  const [isOpen, setIsOpen] = useState(true); 

  // Auto-expand when running
  useEffect(() => {
    if (isRunning) {
      setIsOpen(true);
    }
  }, [isRunning]);

  const allCompleted = steps.length > 0 && steps.every(s => s.status === 'completed'); 

  return ( 
    <div className={`w-full bg-white rounded-xl border border-gray-100 shadow-lg overflow-hidden transition-all duration-300 ${className}`}> 
      
      {/* Header */} 
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        className="flex items-center justify-between px-4 py-3 bg-gray-50/80 border-b border-gray-100 backdrop-blur-sm cursor-pointer hover:bg-gray-100/80 transition-colors select-none" 
      > 
        <div className="flex items-center gap-2"> 
          <div className={`flex items-center justify-center w-6 h-6 rounded-full transition-colors ${allCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}> 
            {isRunning ? ( 
              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> 
            ) : ( 
              <Check size={14} strokeWidth={2.5} /> 
            )} 
          </div> 
          <span className="text-sm font-semibold text-gray-700"> 
            {isRunning ? '正在执行...' : '自动化流程'} 
          </span> 
        </div> 
        
        <div className="flex items-center gap-1"> 
          {onRestart && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onRestart();
              }} 
              disabled={isRunning} 
              className="text-gray-400 hover:text-indigo-600 transition-colors p-1 rounded-md hover:bg-gray-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed" 
              title="重新演示" 
            > 
              <RotateCcw size={16} /> 
            </button> 
          )}
          
          {/* Fold Indicator */} 
          <div className={`text-gray-400 transition-transform duration-300 p-1 ${isOpen ? 'rotate-180' : ''}`}> 
            <ChevronDown size={18} /> 
          </div> 
        </div> 
      </div> 

      {/* List Area */} 
      <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}> 
        <div className="px-5 py-5 overflow-y-auto max-h-[400px]"> 
          {steps.length === 0 ? (
            <div className="text-center text-gray-400 text-sm py-4">暂无步骤</div>
          ) : (
            <div className="space-y-0"> 
              {steps.map((step, index) => { 
                const isLast = index === steps.length - 1; 
                const isCompleted = step.status === 'completed'; 
                const isCurrent = step.status === 'current'; 
                const isPending = step.status === 'pending'; 

                return ( 
                  <div key={step.id} className="relative flex gap-3.5"> 
                    
                    {!isLast && ( 
                      <div className="absolute left-[11px] top-7 w-[2px] h-[calc(100%+4px)] bg-gray-100 -z-0"> 
                        <div className={`w-full bg-emerald-500 transition-all duration-500 ease-linear ${isCompleted ? 'h-full' : 'h-0'}`} /> 
                      </div> 
                    )} 

                    <div className={` 
                      relative z-10 flex-shrink-0 w-6 h-6 mt-0.5 rounded-full border-[1.5px] flex items-center justify-center transition-all duration-300 
                      ${isCompleted 
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' 
                        : isCurrent 
                          ? 'bg-white border-indigo-500 shadow-indigo-100 shadow-md scale-110' 
                          : 'bg-white border-gray-200' 
                      } 
                    `}> 
                      {isCompleted && <Check size={12} strokeWidth={3} />} 
                      {isCurrent && <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />} 
                    </div> 

                    <div className={`pb-6 flex-1 flex items-center transition-opacity duration-300 ${isPending ? 'opacity-40' : 'opacity-100'}`}> 
                      <span className={`text-sm font-medium transition-colors ${isCurrent ? 'text-indigo-600' : isCompleted ? 'text-gray-500 line-through decoration-emerald-500/30' : 'text-gray-700'}`}> 
                        {step.title} 
                      </span> 
                    </div> 
                  </div> 
                ); 
              })} 
            </div> 
          )}
        </div> 
      </div> 

    </div> 
  ); 
}; 

export default TaskStatus; 
