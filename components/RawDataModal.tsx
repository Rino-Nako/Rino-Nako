import React from 'react';
import { X } from 'lucide-react';

interface RawDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
}

export default function RawDataModal({ isOpen, onClose, content }: RawDataModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-[600px] max-h-[80vh] flex flex-col p-6 transform transition-all scale-100 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-800">原始数据</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto bg-gray-50 rounded-lg p-4 border border-gray-100">
          <pre className="text-sm font-mono text-gray-700 whitespace-pre-wrap break-all">
            {content}
          </pre>
        </div>
      </div>
    </div>
  );
}
