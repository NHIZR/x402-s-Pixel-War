'use client';

import { useState, useEffect } from 'react';
import { Check, Clock, Palette, Pipette } from 'lucide-react';
import { cn } from '@/lib/utils';

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

function getRecentColors(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RECENT_COLORS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentColor(color: string) {
  if (typeof window === 'undefined') return;
  try {
    const recent = getRecentColors();
    const filtered = recent.filter(c => c.toUpperCase() !== color.toUpperCase());
    const updated = [color.toUpperCase(), ...filtered].slice(0, MAX_RECENT_COLORS);
    localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save recent color:', error);
  }
}

// 判断颜色是否需要深色图标
function needsDarkIcon(hexColor: string): boolean {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}

// 颜色按钮组件（紧凑版）
interface ColorButtonProps {
  buttonColor: string;
  isSelected: boolean;
  onClick: () => void;
  title: string;
  size?: 'sm' | 'md';
}

function ColorButton({ buttonColor, isSelected, onClick, title, size = 'sm' }: ColorButtonProps) {
  const iconColor = needsDarkIcon(buttonColor) ? '#000000' : '#FFFFFF';
  const sizeClass = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative rounded border transition-all duration-150',
        'hover:scale-110 hover:shadow-md hover:z-10',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400',
        sizeClass,
        isSelected ? 'border-cyan-400 shadow-cyan-400/30 shadow-sm' : 'border-gray-600 hover:border-gray-400'
      )}
      style={{ backgroundColor: buttonColor }}
      title={title}
      aria-label={title}
      aria-pressed={isSelected}
    >
      {isSelected && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Check
            className={cn(iconSize, 'drop-shadow-md')}
            style={{ color: iconColor }}
          />
        </div>
      )}
    </button>
  );
}

export function ColorPicker({ color, onChange }: ColorPickerProps) {
  const [customColor, setCustomColor] = useState(color);
  const [recentColors, setRecentColors] = useState<string[]>([]);

  useEffect(() => {
    setRecentColors(getRecentColors());
  }, []);

  const handleColorChange = (newColor: string) => {
    onChange(newColor);
    saveRecentColor(newColor);
    setRecentColors(getRecentColors());
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomColor(val);
    if (/^#[0-9A-F]{6}$/i.test(val)) {
      handleColorChange(val);
    }
  };

  return (
    <div className="flex items-start gap-4">
      {/* 左侧：最近使用 + 常用颜色 */}
      <div className="flex-1 flex gap-4">
        {/* 最近使用的颜色 */}
        {recentColors.length > 0 && (
          <div className="flex-shrink-0">
            <div className="flex items-center gap-1.5 mb-2">
              <Clock className="w-3 h-3 text-purple-400" />
              <span className="text-xs text-gray-400">最近使用</span>
            </div>
            <div className="flex gap-1.5 flex-wrap" style={{ maxWidth: '168px' }}>
              {recentColors.map((recentColor, index) => (
                <ColorButton
                  key={`${recentColor}-${index}`}
                  buttonColor={recentColor}
                  isSelected={color === recentColor}
                  onClick={() => {
                    handleColorChange(recentColor);
                    setCustomColor(recentColor);
                  }}
                  title={`最近使用 ${recentColor}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* 常用颜色网格 */}
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-2">
            <Palette className="w-3 h-3 text-cyan-400" />
            <span className="text-xs text-gray-400">常用颜色</span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {PRESET_COLORS.map((preset) => (
              <ColorButton
                key={preset.color}
                buttonColor={preset.color}
                isSelected={color === preset.color}
                onClick={() => {
                  handleColorChange(preset.color);
                  setCustomColor(preset.color);
                }}
                title={preset.name}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 右侧：自定义颜色输入 */}
      <div className="flex-shrink-0">
        <div className="flex items-center gap-1.5 mb-2">
          <Pipette className="w-3 h-3 text-green-400" />
          <span className="text-xs text-gray-400">自定义</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative group">
            <div
              className={cn(
                'w-8 h-8 rounded border-2 cursor-pointer transition-all',
                'group-hover:border-cyan-400',
                'border-gray-600'
              )}
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
              aria-label="打开调色盘"
            />
          </div>
          <input
            type="text"
            value={customColor}
            onChange={handleCustomColorChange}
            onBlur={() => {
              if (!/^#[0-9A-F]{6}$/i.test(customColor)) {
                setCustomColor(color);
              }
            }}
            className={cn(
              'w-20 px-2 py-1.5 bg-gray-900 border rounded text-white font-mono text-xs',
              'focus:outline-none focus:border-cyan-400',
              'border-gray-600'
            )}
            placeholder="#FF0000"
            maxLength={7}
            aria-label="十六进制颜色代码"
          />
        </div>
      </div>
    </div>
  );
}
