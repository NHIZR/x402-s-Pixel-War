'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
import { WalletConnectionGuide } from '@/components/WalletConnectionGuide';
import type { Pixel as PixelType } from '@/lib/types/game.types';
import { PIXEL_FLASH_DURATION } from '@/lib/constants/game';

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

      const grid: PixelType[][] = Array.from({ length: 36 }, () => []);

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

  // 监听 Shift 键状态
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(true);
        isShiftPressedRef.current = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(false);
        isShiftPressedRef.current = false;
        setIsDragging(false);
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

  // 拖动选择相关状态
  const [isDragging, setIsDragging] = useState(false);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const isShiftPressedRef = useRef(false);
  const isDraggingRef = useRef(false);

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

          useGameStore.getState().updatePixel(
            updatedPixel.x,
            updatedPixel.y,
            pixelData
          );

          triggerFlash(updatedPixel.x, updatedPixel.y);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, triggerFlash]);

  const isPixelSelected = (pixel: PixelType) => {
    return selectedPixels.some(p => p.x === pixel.x && p.y === pixel.y);
  };

  const handleMouseDown = (pixel: PixelType) => {
    const isShift = isShiftPressedRef.current;
    if (isShift) {
      setIsDragging(true);
      isDraggingRef.current = true;
      togglePixelSelection(pixel);
    }
  };

  const handleMouseEnter = (pixel: PixelType) => {
    const isShift = isShiftPressedRef.current;
    const dragging = isDraggingRef.current;
    if (dragging && isShift) {
      if (!isPixelSelected(pixel)) {
        togglePixelSelection(pixel);
      }
    }
  };

  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
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
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      {/* 右上角按钮组 */}
      <div className="fixed top-4 right-96 z-20 flex gap-2" suppressHydrationWarning>
        <button
          className="px-4 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-cyan-400 rounded-lg text-sm font-medium transition-colors"
          onClick={toggleLanguage}
          title={mounted ? t('switchLanguage') : 'Switch Language'}
        >
          {mounted ? (language === 'en' ? '中文' : 'EN') : '...'}
        </button>
        <a
          href="https://x402spixelwar.mintlify.app/introduction"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-cyan-400 rounded-lg text-sm font-medium transition-colors"
        >
          {mounted ? t('docs') : 'Docs'}
        </a>
      </div>

      {/* 钱包连接引导（低余额提示） */}
      <WalletConnectionGuide />

      <div className="mb-6 text-center max-w-3xl">
        <h1 className="text-4xl font-bold mb-3" suppressHydrationWarning>
          {mounted ? t('title') : 'Pixel War'}
        </h1>
        <p className="text-cyber-white/80 mb-2" suppressHydrationWarning>
          {connected ? (
            <>
              {mounted ? t('payToConquer') : 'Pay'} <span className="text-cyan-400 font-semibold">USDC</span> {mounted ? t('toConquerPixels') : 'to conquer pixels.'} <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-cyan-400 font-mono text-sm mx-1">Shift</kbd> <span className="text-cyan-400 font-semibold">+</span> {mounted ? t('andDragToSelect') : 'Drag to select multiple pixels'}
            </>
          ) : (
            <span className="text-cyan-400">👁️ {mounted ? t('guestMode') : 'Guest Mode'} - {mounted ? (language === 'en' ? 'Connect wallet to participate' : '连接钱包后即可参与') : 'Connect wallet to participate'}</span>
          )}
        </p>
        <p className="text-cyber-white/70 text-sm" suppressHydrationWarning>
          {mounted ? t('startingPrice') : 'Starting price'} <span className="text-cyan-400 font-semibold">0.01</span> USDC{mounted ? (language === 'en' ? ', ' : '，') : ', '}{mounted ? t('priceIncrease') : 'price increases by'} <span className="text-cyan-400 font-semibold">20%</span> {mounted ? t('perConquest') : 'per conquest'}
        </p>
      </div>

      <div
        className="grid gap-0 bg-cyber-black p-3 rounded-lg border border-gray-800 w-full max-w-[1400px] mx-auto"
        style={{
          gridTemplateColumns: 'repeat(64, minmax(0, 1fr))',
          aspectRatio: '64 / 36',
          maxHeight: '70vh',
        }}
      >
        {pixels.map((row, y) =>
          row.map((pixel, x) => (
            <Pixel
              key={`${x}-${y}`}
              pixel={pixel}
              isFlashing={flashingPixels.has(`${x}-${y}`)}
              isSelected={isPixelSelected(pixel)}
              onClick={() => selectPixel(pixel)}
              onShiftClick={() => togglePixelSelection(pixel)}
              onMouseDown={() => handleMouseDown(pixel)}
              onMouseEnter={() => handleMouseEnter(pixel)}
            />
          ))
        )}
      </div>

      {/* 文字购买像素悬浮按钮 - 位于像素图下方 */}
      {connected && (
        <div className="mt-6">
          <button
            className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border border-cyan-400/50 rounded-xl text-base font-semibold transition-all shadow-lg hover:shadow-cyan-500/25 flex items-center gap-3 hover:scale-105"
            onClick={() => setShowTextTool(true)}
            suppressHydrationWarning
          >
            <Type className="w-5 h-5" />
            <span>{mounted ? (language === 'en' ? 'Buy Pixels with Text' : '文字购买像素') : 'Buy Pixels with Text'}</span>
            <Sparkles className="w-4 h-4 opacity-70" />
          </button>
        </div>
      )}

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
