'use client';

import { useState, useEffect } from 'react';
import { Check, Clock } from 'lucide-react';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

const PRESET_COLORS = [
  { name: '红色', color: '#FF0000' },
  { name: '橙色', color: '#FF8800' },
  { name: '黄色', color: '#FFDD00' },
  { name: '绿色', color: '#00FF00' },
  { name: '青色', color: '#00FFFF' },
  { name: '蓝色', color: '#0088FF' },
  { name: '紫色', color: '#8800FF' },
  { name: '粉色', color: '#FF00FF' },
  { name: '白色', color: '#FFFFFF' },
  { name: '灰色', color: '#888888' },
  { name: '黑色', color: '#000000' },
  { name: '棕色', color: '#8B4513' },
];

const RECENT_COLORS_KEY = 'pixelwar_recent_colors';
const MAX_RECENT_COLORS = 6;

// 从 localStorage 获取最近使用的颜色
function getRecentColors(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RECENT_COLORS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// 保存最近使用的颜色
function saveRecentColor(color: string) {
  if (typeof window === 'undefined') return;
  try {
    const recent = getRecentColors();
    // 移除重复的颜色
    const filtered = recent.filter(c => c.toUpperCase() !== color.toUpperCase());
    // 添加到开头
    const updated = [color.toUpperCase(), ...filtered].slice(0, MAX_RECENT_COLORS);
    localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save recent color:', error);
  }
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  const [customColor, setCustomColor] = useState(color);
  const [recentColors, setRecentColors] = useState<string[]>([]);

  // 加载最近使用的颜色
  useEffect(() => {
    setRecentColors(getRecentColors());
  }, []);

  // 处理颜色变化，保存到最近使用
  const handleColorChange = (newColor: string) => {
    onChange(newColor);
    saveRecentColor(newColor);
    setRecentColors(getRecentColors()); // 更新显示
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomColor(val);

    // 只有完整的6位hex颜色才更新
    if (/^#[0-9A-F]{6}$/i.test(val)) {
      handleColorChange(val);
    }
  };

  return (
    <div className="space-y-4">
      {/* 最近使用的颜色 */}
      {recentColors.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-cyan-400" />
            <p className="text-sm font-medium text-gray-300">最近使用</p>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {recentColors.map((recentColor, index) => (
              <button
                key={`${recentColor}-${index}`}
                onClick={() => {
                  handleColorChange(recentColor);
                  setCustomColor(recentColor);
                }}
                className="relative w-full aspect-square rounded border-2 transition-all hover:scale-110"
                style={{
                  backgroundColor: recentColor,
                  borderColor: color === recentColor ? '#00FFFF' : '#4B5563',
                }}
                title={`最近使用 ${recentColor}`}
              >
                {color === recentColor && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check
                      className="w-5 h-5 drop-shadow-lg"
                      style={{
                        color: recentColor === '#FFFFFF' || recentColor === '#FFDD00' ? '#000000' : '#FFFFFF'
                      }}
                    />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 预设颜色网格 */}
      <div>
        <p className="text-sm font-medium mb-3 text-gray-300">常用颜色</p>
        <div className="grid grid-cols-6 gap-2">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset.color}
              onClick={() => {
                handleColorChange(preset.color);
                setCustomColor(preset.color);
              }}
              className="relative w-full aspect-square rounded border-2 transition-all hover:scale-110"
              style={{
                backgroundColor: preset.color,
                borderColor: color === preset.color ? '#00FFFF' : '#4B5563',
              }}
              title={preset.name}
            >
              {color === preset.color && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Check
                    className="w-5 h-5 drop-shadow-lg"
                    style={{
                      color: preset.color === '#FFFFFF' || preset.color === '#FFDD00' ? '#000000' : '#FFFFFF'
                    }}
                  />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 自定义颜色输入 */}
      <div>
        <p className="text-sm font-medium mb-2 text-gray-300">自定义颜色</p>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className="w-12 h-12 rounded border-2 border-gray-600 shadow-lg flex-shrink-0 cursor-pointer hover:border-cyan-400 transition-colors"
              style={{ backgroundColor: color }}
            />
            <input
              type="color"
              value={color}
              onChange={(e) => {
                const newColor = e.target.value.toUpperCase();
                handleColorChange(newColor);
                setCustomColor(newColor);
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              title="点击选择颜色"
            />
          </div>
          <input
            type="text"
            value={customColor}
            onChange={handleCustomColorChange}
            onBlur={() => {
              // 失焦时如果格式不对，恢复当前有效颜色
              if (!/^#[0-9A-F]{6}$/i.test(customColor)) {
                setCustomColor(color);
              }
            }}
            className="flex-1 px-3 py-2 bg-gray-900 border border-gray-600 rounded text-white font-mono text-sm focus:outline-none focus:border-cyan-400 transition-colors"
            placeholder="#FF0000"
            maxLength={7}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          点击颜色框打开调色盘，或输入十六进制颜色代码
        </p>
      </div>
    </div>
  );
}
