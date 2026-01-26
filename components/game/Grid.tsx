'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useGameStore } from '@/lib/stores/gameStore';
import { useUserStore } from '@/lib/stores/userStore';
import { useLanguage } from '@/lib/i18n';
import { Pixel } from './Pixel';
import { PixelInfoModal } from './PixelInfoModal';
import { BatchConquerModal } from './BatchConquerModal';
import { TextToolModal } from './TextToolModal';
import { LoadingScreen } from '@/components/ui/loading';
import { Type, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Pixel as PixelType } from '@/lib/types/game.types';
import { PIXEL_FLASH_DURATION } from '@/lib/constants/game';
import { BatchUpdateQueue } from '@/lib/utils/debounce';

export function Grid() {
  const { connected } = useWallet();
  const { t, language, toggleLanguage } = useLanguage();
  const {
    pixels,
    loading,
    error,
    selectedPixels,
    setPixels,
    setLoading,
    setError,
    selectPixel,
    togglePixelSelection,
    clearSelection
  } = useGameStore();
  const [flashingPixels, setFlashingPixels] = useState<Set<string>>(new Set());
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showTextTool, setShowTextTool] = useState(false);
  const [mounted, setMounted] = useState(false);
  const supabaseRef = useRef(createClient());

  // 拖动选择状态 - 只使用 ref 避免不必要的重渲染
  const isDraggingRef = useRef(false);
  const isShiftPressedRef = useRef(false);

  // Track mount state to prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);
  const supabase = supabaseRef.current;

  const triggerFlash = useCallback((x: number, y: number) => {
    const key = `${x}-${y}`;
    setFlashingPixels((prev) => new Set(prev).add(key));

    setTimeout(() => {
      setFlashingPixels((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }, PIXEL_FLASH_DURATION);
  }, []);

  const loadGrid = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_grid_state');

      if (error) {
        console.error('Load grid failed:', error);
        setError(error.message);
        return;
      }

      if (!data) {
        setError('No grid data');
        return;
      }

      const grid: PixelType[][] = Array.from({ length: 56 }, () => []);

      (data as any[]).forEach((pixel: any) => {
        grid[pixel.y][pixel.x] = {
          id: pixel.id,
          x: pixel.x,
          y: pixel.y,
          color: pixel.color,
          currentPrice: pixel.currentPrice,
          ownerId: pixel.ownerId,
          conquestCount: pixel.conquestCount,
          lastConqueredAt: pixel.lastConqueredAt,
        };
      });

      setPixels(grid);
    } catch (err) {
      console.error('Load grid error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [supabase, setLoading, setError, setPixels]);

  // 加载初始网格状态
  useEffect(() => {
    loadGrid();
  }, [loadGrid]);

  // 监听 Shift 键状态 - 只使用 ref 避免不必要的重渲染
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        isShiftPressedRef.current = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        isShiftPressedRef.current = false;
        isDraggingRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // 批量更新队列 - 防抖优化实时更新
  const updateQueueRef = useRef<BatchUpdateQueue<{ x: number; y: number; data: Partial<PixelType> }> | null>(null);

  // 初始化批量更新队列
  useEffect(() => {
    updateQueueRef.current = new BatchUpdateQueue(
      (updates) => {
        // 批量更新像素
        const pixelUpdates = updates.map(({ data }) => ({
          x: data.x,
          y: data.y,
          data: data.data,
        }));
        useGameStore.getState().updatePixelsBatch(pixelUpdates);

        // 批量触发闪烁动画
        for (const { data } of updates) {
          triggerFlash(data.x, data.y);
        }
      },
      50 // 50ms 防抖延迟，平衡实时性和性能
    );

    return () => {
      updateQueueRef.current?.clear();
    };
  }, [triggerFlash]);

  // 设置实时订阅
  useEffect(() => {
    const channel = supabase
      .channel('pixels-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pixels',
        },
        (payload) => {
          const updatedPixel = payload.new as any;

          const pixelData: Partial<PixelType> = {
            color: updatedPixel.color,
            currentPrice: updatedPixel.current_price,
            ownerId: updatedPixel.wallet_owner || updatedPixel.owner_id,
            conquestCount: updatedPixel.conquest_count,
            lastConqueredAt: updatedPixel.last_conquered_at,
          };

          // 使用批量更新队列，避免频繁状态更新
          const key = `${updatedPixel.x}-${updatedPixel.y}`;
          updateQueueRef.current?.add(key, {
            x: updatedPixel.x,
            y: updatedPixel.y,
            data: pixelData,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // 使用 useMemo 缓存选中像素的 Set，提高查找性能 O(1)
  const selectedPixelSet = useMemo(() => {
    return new Set(selectedPixels.map(p => `${p.x}-${p.y}`));
  }, [selectedPixels]);

  // 使用 useCallback 包装事件处理器，避免每次渲染创建新函数
  const handleMouseDown = useCallback((pixel: PixelType) => {
    if (isShiftPressedRef.current) {
      isDraggingRef.current = true;
      togglePixelSelection(pixel);
    }
  }, [togglePixelSelection]);

  const handleMouseEnter = useCallback((pixel: PixelType) => {
    if (isDraggingRef.current && isShiftPressedRef.current) {
      if (!selectedPixelSet.has(`${pixel.x}-${pixel.y}`)) {
        togglePixelSelection(pixel);
      }
    }
  }, [togglePixelSelection, selectedPixelSet]);

  const handlePixelClick = useCallback((pixel: PixelType) => {
    selectPixel(pixel);
  }, [selectPixel]);

  const handlePixelShiftClick = useCallback((pixel: PixelType) => {
    togglePixelSelection(pixel);
  }, [togglePixelSelection]);

  // 监听全局鼠标释放事件
  useEffect(() => {
    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  if (loading) {
    return <LoadingScreen message={t('loadingBattlefield')} />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cyber-black">
        <div className="text-center max-w-md p-8 bg-gray-900 border border-red-500/50 rounded-lg">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-400 mb-2">{t('loadFailed')}</h2>
          <p className="text-cyber-white/70 mb-6">{error}</p>
          <Button onClick={loadGrid} size="lg">
            {t('retry')}
          </Button>
        </div>
      </div>
    );
  }

  if (pixels.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-cyber-white/70 mb-4">{t('gridNotInitialized')}</p>
          <p className="text-sm text-cyber-white/50">
            {t('runInSupabase')} <code className="bg-gray-800 px-2 py-1 rounded">SELECT initialize_grid();</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen">
      {/* 页面顶部标题区域 */}
      <div className="w-full text-center py-3" suppressHydrationWarning>
        <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-white via-cyan-300 to-cyan-400 bg-clip-text text-transparent">
          {mounted ? t('title') : 'Pixel War'}
        </h1>
        {/* 第一行：操作说明 */}
        <p className="text-sm text-gray-300 mb-1">
          {mounted ? (language === 'en' ? 'Pay' : '支付') : 'Pay'}{' '}
          <span className="text-cyan-400 font-semibold">USDC</span>{' '}
          {mounted ? (language === 'en' ? 'to conquer pixels, hold' : '占领像素，按住') : 'to conquer pixels, hold'}{' '}
          <kbd className="px-1.5 py-0.5 bg-gray-800 border border-gray-600 rounded text-cyan-400 font-mono text-xs">Shift</kbd>
          {' '}+ {mounted ? (language === 'en' ? 'drag to multi-select' : '拖动可多选') : 'drag to multi-select'}
        </p>
        {/* 第二行：价格信息 */}
        <p className="text-sm text-gray-400">
          {mounted ? (language === 'en' ? 'Starting price' : '起始价格') : 'Starting price'}{' '}
          <span className="text-cyan-400 font-semibold">0.01</span> USDC，
          {mounted ? (language === 'en' ? 'price increases' : '每次占领价格上涨') : 'price increases'}{' '}
          <span className="text-cyan-400 font-semibold">20%</span>{' '}
          {mounted ? (language === 'en' ? 'per conquest' : '') : 'per conquest'}
        </p>
      </div>

      {/* 右上角按钮组 */}
      <div className="fixed top-4 right-96 z-30 flex items-center gap-2" suppressHydrationWarning>
        <button
          className="px-4 py-2 bg-gray-900/90 hover:bg-gray-800 border border-gray-700 hover:border-cyan-400 rounded-lg text-sm font-medium transition-all hover:shadow-lg backdrop-blur-sm"
          onClick={toggleLanguage}
          title={mounted ? t('switchLanguage') : 'Switch Language'}
        >
          {mounted ? (language === 'en' ? '中文' : 'EN') : '...'}
        </button>
        <a
          href="https://x402spixelwar.mintlify.app/introduction"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-gray-900/90 hover:bg-gray-800 border border-gray-700 hover:border-cyan-400 rounded-lg text-sm font-medium transition-all hover:shadow-lg backdrop-blur-sm"
        >
          {mounted ? t('docs') : 'Docs'}
        </a>
        <a
          href="https://github.com/NHIZR/x402-s-Pixel-War"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-gray-900/90 hover:bg-gray-800 border border-gray-700 hover:border-cyan-400 rounded-lg text-sm font-medium transition-all hover:shadow-lg backdrop-blur-sm"
        >
          GitHub
        </a>
      </div>

      {/* 像素网格容器 */}
      <div className="relative w-full max-w-[1600px] mx-auto px-4">
        {/* 像素网格 */}
        <div
          role="grid"
          aria-label="Pixel War Grid - 100x56 pixels"
          aria-rowcount={56}
          aria-colcount={100}
          className="grid gap-0 bg-cyber-black p-3 rounded-lg border border-gray-800 w-full"
          style={{
            gridTemplateColumns: 'repeat(100, minmax(0, 1fr))',
            aspectRatio: '100 / 56',
            maxHeight: '85vh',
          }}
        >
        {pixels.map((row, y) =>
          row.map((pixel, x) => (
            <Pixel
              key={`${x}-${y}`}
              pixel={pixel}
              isFlashing={flashingPixels.has(`${x}-${y}`)}
              isSelected={selectedPixelSet.has(`${x}-${y}`)}
              onClick={() => handlePixelClick(pixel)}
              onShiftClick={() => handlePixelShiftClick(pixel)}
              onMouseDown={() => handleMouseDown(pixel)}
              onMouseEnter={() => handleMouseEnter(pixel)}
            />
          ))
        )}
        </div>

        {/* 文字购买像素悬浮按钮 - 位于像素图下方，在容器内 */}
        {connected && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
            <button
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border border-cyan-400/50 rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-cyan-500/25 flex items-center gap-2 hover:scale-105 backdrop-blur-sm"
              onClick={() => setShowTextTool(true)}
              suppressHydrationWarning
            >
              <Type className="w-4 h-4" />
              <span>{mounted ? (language === 'en' ? 'Type Text to Conquer' : '输入文字占领像素') : 'Type Text to Conquer'}</span>
              <Sparkles className="w-3 h-3 opacity-70" />
            </button>
          </div>
        )}
      </div>

      {/* 多选工具栏 */}
      {selectedPixels.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-4 px-6 py-3 bg-gray-900 rounded-lg border border-cyan-400 shadow-2xl">
            <div className="text-sm" suppressHydrationWarning>
              <span className="text-cyan-400 font-bold">{selectedPixels.length}</span>
              <span className="text-gray-400 ml-1">{mounted ? t('pixelsSelected') : 'pixels selected'}</span>
            </div>
            <div className="h-6 w-px bg-gray-700"></div>
            <button
              onClick={clearSelection}
              className="px-4 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors"
              suppressHydrationWarning
            >
              {mounted ? t('clearSelection') : 'Clear'}
            </button>
            <button
              onClick={() => {
                if (!connected) {
                  toast.error(mounted ? t('connectWalletFirst') : 'Connect wallet first', {
                    description: mounted ? t('needSolanaWalletBatch') : 'You need a Solana wallet'
                  });
                } else {
                  setShowBatchModal(true);
                }
              }}
              className="px-4 py-1.5 text-sm bg-cyan-600 hover:bg-cyan-500 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!connected}
              suppressHydrationWarning
            >
              {connected ? (mounted ? t('batchConquerBtn') : 'Batch Conquer') : (mounted ? t('needLogin') : 'Login Required')}
            </button>
          </div>
        </div>
      )}

      {/* 像素详情弹窗 */}
      <PixelInfoModal />

      {/* 批量占领弹窗 */}
      <BatchConquerModal
        open={showBatchModal}
        onClose={() => setShowBatchModal(false)}
      />

      {/* 文字工具弹窗 */}
      <TextToolModal
        open={showTextTool}
        onClose={() => setShowTextTool(false)}
      />
    </div>
  );
}
