'use client';

import { memo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { Pixel as PixelType } from '@/lib/types/game.types';

interface PixelProps {
  pixel: PixelType;
  isFlashing: boolean;
  isSelected?: boolean;
  onClick: () => void;
  onShiftClick?: () => void;
  onMouseDown?: () => void;
  onMouseEnter?: () => void;
}

function PixelComponent({ pixel, isFlashing, isSelected = false, onClick, onShiftClick, onMouseDown, onMouseEnter }: PixelProps) {
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (e.shiftKey && onShiftClick) {
      onShiftClick();
    } else {
      onClick();
    }
  }, [onClick, onShiftClick]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onMouseDown?.();
  }, [onMouseDown]);

  const handleMouseEnter = useCallback(() => {
    onMouseEnter?.();
  }, [onMouseEnter]);

  // 键盘导航支持
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (e.shiftKey && onShiftClick) {
        onShiftClick();
      } else {
        onClick();
      }
    }
  }, [onClick, onShiftClick]);

  // 格式化价格显示
  const priceDisplay = pixel.currentPrice.toFixed(2);
  const ownerStatus = pixel.ownerId ? 'Owned' : 'Available';

  // 判断是否是深色像素（需要浅色边框）
  const isLightPixel = () => {
    const hex = pixel.color.replace('#', '');
    if (hex.length !== 6) return false;
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
  };

  return (
    <button
      type="button"
      role="gridcell"
      className={cn(
        'w-full h-full aspect-square transition-all duration-150',
        'hover:brightness-125 hover:z-10',
        'active:scale-95',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:z-20',
        'select-none',
        isFlashing && 'animate-flash',
        'border-[0.5px]',
        isSelected
          ? 'border-cyan-400 border-[1.5px] z-10 brightness-110'
          : isLightPixel() ? 'border-gray-600/40' : 'border-gray-500/20'
      )}
      style={{
        backgroundColor: pixel.color,
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onKeyDown={handleKeyDown}
      title={`(${pixel.x}, ${pixel.y}) - ${priceDisplay} USDC${isSelected ? ' [Selected]' : ''}`}
      aria-label={`Pixel at position ${pixel.x}, ${pixel.y}. Price: ${priceDisplay} USDC. Status: ${ownerStatus}${isSelected ? '. Currently selected' : ''}`}
      aria-selected={isSelected}
      tabIndex={0}
      draggable={false}
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
