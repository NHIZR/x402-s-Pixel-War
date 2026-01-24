'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useGameStore } from '@/lib/stores/gameStore';
import { useUserStore } from '@/lib/stores/userStore';
import { Pixel } from './Pixel';
import { PixelInfoModal } from './PixelInfoModal';
import { BatchConquerModal } from './BatchConquerModal';
import { UserInfo } from './UserInfo';
import { LoadingScreen } from '@/components/ui/loading';
import { Button } from '@/components/ui/button';
import { FaucetButton } from '@/components/FaucetButton';
import { WalletConnectionGuide } from '@/components/WalletConnectionGuide';
import type { Pixel as PixelType } from '@/lib/types/game.types';
import { PIXEL_FLASH_DURATION, REALTIME_CHANNEL } from '@/lib/constants/game';

export function Grid() {
  const { connected } = useWallet();
  const { walletAddress, balance } = useUserStore();
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
  const supabase = createClient();

  // 加载初始网格状态
  useEffect(() => {
    loadGrid();
  }, []);

  // 监听 Shift 键状态
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        console.log('🔵 Shift 键按下');
        setIsShiftPressed(true);
        isShiftPressedRef.current = true; // 同步更新 ref
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        console.log('🔴 Shift 键松开');
        setIsShiftPressed(false);
        isShiftPressedRef.current = false; // 同步更新 ref
        setIsDragging(false);
        isDraggingRef.current = false; // 停止拖动
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
  const isShiftPressedRef = useRef(false); // 用 ref 避免闭包问题
  const isDraggingRef = useRef(false); // 同样用 ref 跟踪拖动状态

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

          console.log('🔄 实时更新像素:', updatedPixel);

          // 更新本地状态
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

          // 触发闪烁动画
          triggerFlash(updatedPixel.x, updatedPixel.y);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadGrid = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_grid_state');

      if (error) {
        console.error('加载网格失败:', error);
        setError(error.message);
        return;
      }

      if (!data) {
        setError('未获取到网格数据');
        return;
      }

      // 将平面数组转换为 50x30 二维数组
      const grid: PixelType[][] = Array.from({ length: 30 }, () => []);

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
      console.error('加载网格异常:', err);
      setError(err instanceof Error ? err.message : '未知错误');
    }
  };

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

  // 检查像素是否被选中
  const isPixelSelected = (pixel: PixelType) => {
    return selectedPixels.some(p => p.x === pixel.x && p.y === pixel.y);
  };

  // 处理鼠标按下事件（开始拖动）
  const handleMouseDown = (pixel: PixelType) => {
    const isShift = isShiftPressedRef.current; // 使用 ref 获取最新值
    console.log('🖱️ 鼠标按下:', { x: pixel.x, y: pixel.y, isShiftPressed: isShift });
    if (isShift) {
      console.log('✅ 开始拖动选择');
      setIsDragging(true);
      isDraggingRef.current = true; // 立即更新 ref
      togglePixelSelection(pixel);
    }
  };

  // 处理鼠标进入事件（拖动中）
  const handleMouseEnter = (pixel: PixelType) => {
    const isShift = isShiftPressedRef.current; // 使用 ref 获取最新值
    const dragging = isDraggingRef.current; // 使用 ref 获取最新值
    console.log('👉 鼠标进入:', { x: pixel.x, y: pixel.y, isDragging: dragging, isShift });
    if (dragging && isShift) {
      console.log('🎯 拖动经过像素:', { x: pixel.x, y: pixel.y });
      // 只添加未选中的像素（不取消已选中的，这样拖动体验更好）
      if (!isPixelSelected(pixel)) {
        togglePixelSelection(pixel);
      }
    }
  };

  // 处理鼠标松开事件（结束拖动）
  useEffect(() => {
    const handleMouseUp = () => {
      console.log('🔼 鼠标松开 - 停止拖动');
      setIsDragging(false);
      isDraggingRef.current = false; // 同步更新 ref
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  if (loading) {
    return <LoadingScreen message="加载像素战场中..." />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-cyber-black">
        <div className="text-center max-w-md p-8 bg-gray-900 border border-red-500/50 rounded-lg">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-400 mb-2">加载失败</h2>
          <p className="text-cyber-white/70 mb-6">{error}</p>
          <Button onClick={loadGrid} size="lg">
            重试
          </Button>
        </div>
      </div>
    );
  }

  if (pixels.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-cyber-white/70 mb-4">网格未初始化</p>
          <p className="text-sm text-cyber-white/50">
            请在 Supabase SQL Editor 运行: <code className="bg-gray-800 px-2 py-1 rounded">SELECT initialize_grid();</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      {/* 左上角按钮组 */}
      <div className="fixed top-4 left-4 z-10 flex gap-2">
        {/* 语言切换按钮 */}
        <button
          className="px-3 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-cyan-400 rounded text-sm font-medium transition-colors"
          onClick={() => {
            // TODO: 实现语言切换逻辑
            console.log('切换语言');
          }}
          title="切换语言 / Switch Language"
        >
          🌐 EN/中文
        </button>

        {/* 文档按钮 */}
        <a
          href="/Docs/README.md"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 hover:border-cyan-400 rounded text-sm font-medium transition-colors"
          title="查看文档 / View Documentation"
        >
          📄 DOCS
        </a>
      </div>

      {/* 用户信息和水龙头按钮 */}
      <div className="fixed top-4 right-4 z-10 flex items-center gap-3">
        <FaucetButton />
        <UserInfo />
      </div>

      {/* 钱包连接引导（低余额提示） */}
      <WalletConnectionGuide />

      <div className="mb-6 text-center max-w-3xl">
        <h1 className="text-4xl font-bold mb-3">x402&apos;s Pixel War</h1>
        <p className="text-cyber-white/80 mb-2">
          {connected ? (
            <>
              支付 <span className="text-cyan-400 font-semibold">USDC</span> 占领像素，按住 <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-cyan-400 font-mono text-sm mx-1">Shift</kbd> <span className="text-cyan-400 font-semibold">+</span> 拖动可多选
            </>
          ) : (
            <span className="text-cyan-400">👁️ 游客模式 - 连接钱包后即可参与</span>
          )}
        </p>
        <p className="text-cyber-white/70 text-sm">
          起始价格 <span className="text-cyan-400 font-semibold">0.01</span> USDC，每次占领价格上涨 <span className="text-cyan-400 font-semibold">20%</span>
        </p>
      </div>

      <div
        className="grid gap-0 bg-cyber-black p-3 rounded-lg border border-gray-800 w-full max-w-[1200px] mx-auto"
        style={{
          gridTemplateColumns: 'repeat(50, minmax(0, 1fr))',
          aspectRatio: '50 / 30',
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

      {/* 多选工具栏 */}
      {selectedPixels.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-4 px-6 py-3 bg-gray-900 rounded-lg border border-cyan-400 shadow-2xl">
            <div className="text-sm">
              <span className="text-cyan-400 font-bold">{selectedPixels.length}</span>
              <span className="text-gray-400 ml-1">个像素已选择</span>
            </div>
            <div className="h-6 w-px bg-gray-700"></div>
            <button
              onClick={clearSelection}
              className="px-4 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors"
            >
              清除选择
            </button>
            <button
              onClick={() => {
                if (!connected) {
                  toast.error('请先连接钱包', {
                    description: '需要连接 Solana 钱包才能批量占领像素'
                  });
                } else {
                  setShowBatchModal(true);
                }
              }}
              className="px-4 py-1.5 text-sm bg-cyan-600 hover:bg-cyan-500 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!connected}
            >
              {connected ? '批量占领' : '需要登录'}
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
    </div>
  );
}
