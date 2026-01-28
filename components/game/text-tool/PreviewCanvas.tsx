'use client';

import { useRef, useCallback, useEffect, useState, memo, useMemo } from 'react';
import { ZoomIn, ZoomOut, Hand, Maximize2 } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import type { Pixel } from '@/lib/types/game.types';
import { GRID_WIDTH, GRID_HEIGHT } from '@/lib/constants/game';

interface PreviewPixel {
  x: number;
  y: number;
  isText: boolean;
}

interface PreviewCanvasProps {
  text: string;
  posX: number;
  posY: number;
  textSize: { width: number; height: number };
  charWidth: number;
  charHeight: number;
  textColor: string;
  bgColor: string;
  previewPixels: PreviewPixel[];
  pixels: Pixel[][];
  onPositionChange: (x: number, y: number) => void;
  onScaleUp: () => void;
  onScaleDown: () => void;
  onCenter: () => void;
}

function PreviewCanvasComponent({
  text,
  posX,
  posY,
  textSize,
  charWidth,
  charHeight,
  textColor,
  bgColor,
  previewPixels,
  pixels,
  onPositionChange,
  onScaleUp,
  onScaleDown,
  onCenter,
}: PreviewCanvasProps) {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const [containerWidth, setContainerWidth] = useState(800);

  // 创建像素颜色查找表（使用 useMemo 缓存）
  const previewPixelMap = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const p of previewPixels) {
      map.set(`${p.x}-${p.y}`, p.isText);
    }
    return map;
  }, [previewPixels]);

  // 监听容器宽度变化
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth - 24); // 减去 padding
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // 计算缩放比例，使整个画布适应容器宽度
  const scale = containerWidth / GRID_WIDTH;
  const displayWidth = Math.floor(GRID_WIDTH * scale);
  const displayHeight = Math.floor(GRID_HEIGHT * scale);

  // 使用 Canvas 渲染完整预览
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas 内部尺寸为原始网格大小
    canvas.width = GRID_WIDTH;
    canvas.height = GRID_HEIGHT;

    // 清空画布
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, GRID_WIDTH, GRID_HEIGHT);

    // 渲染每个像素
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        const key = `${x}-${y}`;
        const isText = previewPixelMap.get(key);
        const isPreviewPixel = previewPixelMap.has(key);

        // 获取真实像素的颜色
        const realPixel = pixels[y]?.[x];
        const realColor = realPixel?.color || '#1a1a2e';

        // 决定显示的颜色
        let displayColor = realColor;
        if (isText) displayColor = textColor;
        else if (isPreviewPixel) displayColor = bgColor;

        ctx.fillStyle = displayColor;
        ctx.fillRect(x, y, 1, 1);
      }
    }

    // 绘制文字区域边框（往外延伸 2px，不遮挡文字）
    if (text) {
      const padding = 2;
      const borderX = posX - padding;
      const borderY = posY - padding;
      const borderW = textSize.width + padding * 2;
      const borderH = textSize.height + padding * 2;

      ctx.strokeStyle = '#2775CA'; // USDC 蓝色
      ctx.lineWidth = 1;
      ctx.strokeRect(borderX + 0.5, borderY + 0.5, borderW - 1, borderH - 1);
    }

  }, [previewPixelMap, pixels, textColor, bgColor, text, posX, posY, textSize]);

  // 拖拽处理
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!text) return;
    e.preventDefault();
    isDraggingRef.current = true;
  }, [text]);

  // 全局鼠标/触摸事件监听
  useEffect(() => {
    const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current || !canvasRef.current) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const rect = canvasRef.current.getBoundingClientRect();
      // 计算相对于 canvas 的位置，考虑 CSS 缩放
      const scaleX = GRID_WIDTH / rect.width;
      const scaleY = GRID_HEIGHT / rect.height;
      const relativeX = (clientX - rect.left) * scaleX;
      const relativeY = (clientY - rect.top) * scaleY;

      // 将鼠标位置转换为网格坐标
      let newX = Math.round(relativeX - textSize.width / 2);
      let newY = Math.round(relativeY - textSize.height / 2);

      newX = Math.max(0, Math.min(GRID_WIDTH - textSize.width, newX));
      newY = Math.max(0, Math.min(GRID_HEIGHT - textSize.height, newY));

      onPositionChange(newX, newY);
    };

    const handleGlobalEnd = () => {
      isDraggingRef.current = false;
    };

    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('mouseup', handleGlobalEnd);
    window.addEventListener('touchmove', handleGlobalMove);
    window.addEventListener('touchend', handleGlobalEnd);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalEnd);
      window.removeEventListener('touchmove', handleGlobalMove);
      window.removeEventListener('touchend', handleGlobalEnd);
    };
  }, [textSize, onPositionChange]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Hand className="w-4 h-4" />
          {t('preview')}
        </label>
        <div className="flex items-center gap-2">
          {/* 文字大小缩放按钮 */}
          <div className="flex items-center gap-1 bg-gray-800 rounded-lg px-2 py-1">
            <button
              onClick={onScaleDown}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title={t('scaleDown')}
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-400 min-w-[60px] text-center">
              {charWidth}x{charHeight}
            </span>
            <button
              onClick={onScaleUp}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title={t('scaleUp')}
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
          {/* 居中按钮 */}
          <button
            onClick={onCenter}
            className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            title={t('center')}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 提示文字 */}
      <p className="text-xs text-gray-500 mb-2">
        {t('dragToMove')}
      </p>

      {/* 可拖拽预览区域 - 显示完整画布 */}
      <div
        ref={containerRef}
        className="bg-gray-900 border border-gray-700 rounded-lg p-3 flex justify-center"
      >
        <canvas
          ref={canvasRef}
          className={`${text ? 'cursor-grab' : 'cursor-default'}`}
          style={{
            imageRendering: 'pixelated',
            width: `${displayWidth}px`,
            height: `${displayHeight}px`,
          }}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        />
      </div>

      {/* 位置显示 */}
      <div className="flex items-center justify-center gap-4 mt-2 text-xs text-gray-400">
        <span>X: <span className="font-mono text-cyan-400">{posX}</span></span>
        <span>Y: <span className="font-mono text-cyan-400">{posY}</span></span>
        <span>{t('size')}: <span className="font-mono text-cyan-400">{textSize.width}x{textSize.height}</span></span>
      </div>
    </div>
  );
}

export const PreviewCanvas = memo(PreviewCanvasComponent);
