import React, { useState } from 'react';
import { Shield } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onSave: (nickname: string) => void;
}

export default function WelcomeModal({ isOpen, onSave }: WelcomeModalProps) {
  const [nickname, setNickname] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-[400px] p-8 transform transition-all scale-100 animate-in zoom-in-95 duration-200">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-2">让我知道你是谁~</h2>
          <p className="text-sm text-gray-500">
            你好！我是 Rino Nako，你叫什么名字呀 /ᐠ .ᆺ. ᐟ\ﾉ
          </p>
        </div>

        <div className="space-y-6">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && nickname.trim()) {
                onSave(nickname.trim());
              }
            }}
            placeholder="输入你的昵称..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-colors text-center text-lg text-gray-800 placeholder-gray-300"
            autoFocus
          />

          <button
            onClick={() => {
              if (nickname.trim()) {
                onSave(nickname.trim());
              }
            }}
            disabled={!nickname.trim()}
            className="w-full py-3 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm shadow-orange-500/20"
          >
            开始旅程
          </button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-400">
          <Shield size={12} className="text-gray-300" />
          <span>您的数据将以本地方式保存，不会上传至服务器。</span>
        </div>
      </div>
    </div>
  );
}
