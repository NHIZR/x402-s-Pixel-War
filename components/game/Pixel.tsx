'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { Pixel as PixelType } from '@/lib/types/game.types';

interface PixelProps {
  pixel: PixelType;
  isFlashing: boolean;
  isSelected?: boolean; // 是否被选中
  onClick: () => void;
  onShiftClick?: () => void; // Shift + 点击
  onMouseDown?: () => void; // 鼠标按下
  onMouseEnter?: () => void; // 鼠标进入
}

function PixelComponent({ pixel, isFlashing, isSelected = false, onClick, onShiftClick, onMouseDown, onMouseEnter }: PixelProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (e.shiftKey && onShiftClick) {
      onShiftClick();
    } else {
      onClick();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // 阻止默认拖动行为（如文本选择、图像拖动等）
    e.preventDefault();
    if (onMouseDown) {
      onMouseDown();
    }
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    // 当鼠标按下时拖动进入
    if (onMouseEnter) {
      onMouseEnter();
    }
  };

  return (
    <button
      className={cn(
        'w-full h-full aspect-square border-[0.5px] transition-all duration-150',
        'hover:border-cyan-400/50 hover:shadow-md',
        'active:scale-95',
        'focus:outline-none',
        'select-none', // 防止文本选择
        isFlashing && 'animate-flash',
        isSelected
          ? 'border-cyan-400 border-2 ring-2 ring-cyan-400/50 z-10'
          : 'border-gray-800/30'
      )}
      style={{
        backgroundColor: pixel.color,
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      title={`(${pixel.x}, ${pixel.y}) - ${pixel.currentPrice} USDC${isSelected ? ' [已选择]' : ''}`}
      aria-label={`像素 ${pixel.x}, ${pixel.y}`}
      draggable={false} // 禁用拖动
    />
  );
}

// Memoize to prevent unnecessary re-renders
export const Pixel = memo(PixelComponent, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.pixel.color === nextProps.pixel.color &&
    prevProps.pixel.currentPrice === nextProps.pixel.currentPrice &&
    prevProps.pixel.ownerId === nextProps.pixel.ownerId &&
    prevProps.isFlashing === nextProps.isFlashing &&
    prevProps.isSelected === nextProps.isSelected
  );
});
