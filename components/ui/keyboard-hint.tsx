'use client';

import { useState } from 'react';
import { Keyboard, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KeyboardHintProps {
  className?: string;
}

const shortcuts = [
  { keys: ['Shift', 'Drag'], description: '多选像素' },
  { keys: ['Shift', 'Click'], description: '切换选中' },
  { keys: ['Enter'], description: '确认操作' },
  { keys: ['Esc'], description: '关闭弹窗' },
];

export function KeyboardHint({ className }: KeyboardHintProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn('relative', className)}>
      {/* 触发按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'p-2 rounded-lg border transition-all',
          'hover:bg-gray-800 hover:border-gray-600',
          isOpen
            ? 'bg-gray-800 border-cyan-400 text-cyan-400'
            : 'bg-gray-900 border-gray-700 text-gray-400'
        )}
        title="键盘快捷键"
        aria-label="显示键盘快捷键"
        aria-expanded={isOpen}
      >
        <Keyboard className="w-4 h-4" />
      </button>

      {/* 快捷键面板 */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
          {/* 标题栏 */}
          <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
            <span className="text-sm font-medium text-gray-200">键盘快捷键</span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              aria-label="关闭"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          </div>

          {/* 快捷键列表 */}
          <div className="p-2 space-y-1">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-gray-800/50"
              >
                <span className="text-xs text-gray-400">{shortcut.description}</span>
                <div className="flex items-center gap-1">
                  {shortcut.keys.map((key, keyIndex) => (
                    <span key={keyIndex}>
                      <kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-800 border border-gray-600 rounded text-cyan-400">
                        {key}
                      </kbd>
                      {keyIndex < shortcut.keys.length - 1 && (
                        <span className="text-gray-600 mx-0.5">+</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// 内联键盘提示（用于说明文字中）
interface KbdProps {
  children: React.ReactNode;
  className?: string;
}

export function Kbd({ children, className }: KbdProps) {
  return (
    <kbd
      className={cn(
        'px-1.5 py-0.5 text-xs font-mono bg-gray-800 border border-gray-600 rounded text-cyan-400',
        className
      )}
    >
      {children}
    </kbd>
  );
}
