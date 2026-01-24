'use client';

import { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { toast } from 'sonner';
import { useGameStore } from '@/lib/stores/gameStore';
import { useUserStore } from '@/lib/stores/userStore';
import { ColorPicker } from './ColorPicker';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  formatPrice,
  calculateNewPrice,
} from '@/lib/utils/priceCalculation';
import type { Pixel } from '@/lib/types/game.types';
import { conquerPixelsBatch, recolorPixelsBatch } from '@/lib/services/pixelConquest';

interface BatchConquerModalProps {
  open: boolean;
  onClose: () => void;
}

export function BatchConquerModal({ open, onClose }: BatchConquerModalProps) {
  const { connected, publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { walletAddress, balance } = useUserStore();
  const { selectedPixels, clearSelection } = useGameStore();
  const [selectedColor, setSelectedColor] = useState('#FF0000');
  const [isProcessing, setIsProcessing] = useState(false);

  // 计算总价格
  const totalPrice = selectedPixels.reduce((sum, pixel) => sum + pixel.currentPrice, 0);

  // 统计信息
  const stats = {
    total: selectedPixels.length,
    owned: selectedPixels.filter(p => p.ownerId === walletAddress).length,
    available: selectedPixels.filter(p => p.ownerId !== walletAddress).length,
  };

  // 过滤出可占领的像素（排除已拥有的）
  const conquerable = selectedPixels.filter(p => p.ownerId !== walletAddress);
  const conquerablePrice = conquerable.reduce((sum, pixel) => sum + pixel.currentPrice, 0);

  // 过滤出已拥有的像素（可免费换色）
  const ownedPixels = selectedPixels.filter(p => p.ownerId === walletAddress);

  const canConquer = connected && conquerable.length > 0 && balance >= conquerablePrice;
  const canRecolor = connected && ownedPixels.length > 0;

  const handleConquer = async () => {
    if (!connected || !walletAddress || !publicKey) {
      toast.error('请先连接钱包', {
        description: '需要连接 Solana 钱包才能操作'
      });
      return;
    }

    if (conquerable.length === 0 && ownedPixels.length === 0) {
      toast.warning('没有像素', {
        description: '请先选择像素'
      });
      return;
    }

    if (conquerable.length > 0 && balance < conquerablePrice) {
      toast.error('余额不足', {
        description: `需要 ${formatPrice(conquerablePrice)} USDC，当前余额 ${formatPrice(balance)} USDC`
      });
      return;
    }

    setIsProcessing(true);

    const hasConquer = conquerable.length > 0;
    const hasRecolor = ownedPixels.length > 0;

    let loadingMessage = '';
    if (hasConquer && hasRecolor) {
      loadingMessage = `正在处理 ${conquerable.length} 个占领 + ${ownedPixels.length} 个换色...`;
    } else if (hasConquer) {
      loadingMessage = `正在批量占领 ${conquerable.length} 个像素...`;
    } else {
      loadingMessage = `正在批量换色 ${ownedPixels.length} 个像素...`;
    }

    const loadingToast = toast.loading(loadingMessage, {
      description: hasConquer ? `总支付: ${formatPrice(conquerablePrice)} USDC` : '免费换色'
    });

    try {
      let totalSuccess = 0;
      let totalSkipped = 0;
      let totalError = 0;
      let totalPaid = 0;

      // 处理占领像素
      if (hasConquer) {
        const pixelsToConquer = conquerable.map(pixel => ({
          x: pixel.x,
          y: pixel.y,
          color: selectedColor,
          price: pixel.currentPrice
        }));

        const conquerResult = await conquerPixelsBatch(
          connection,
          publicKey,
          sendTransaction,
          pixelsToConquer,
          conquerablePrice
        );

        totalSuccess += conquerResult.successCount;
        totalSkipped += conquerResult.skippedCount || 0;
        totalError += conquerResult.errorCount;
        totalPaid += conquerResult.totalPaid;

        // 更新占领成功的像素
        if (conquerResult.successCount > 0) {
          const successfulPixels = conquerable.slice(0, conquerResult.successCount);
          successfulPixels.forEach(pixel => {
            useGameStore.getState().updatePixel(
              pixel.x,
              pixel.y,
              {
                color: selectedColor,
                currentPrice: pixel.currentPrice * 1.2,
                ownerId: walletAddress,
                conquestCount: pixel.conquestCount + 1,
                lastConqueredAt: new Date().toISOString(),
              }
            );
          });

          // 扣除余额
          const newBalance = balance - conquerResult.totalPaid;
          useUserStore.getState().setBalance(newBalance);
        }
      }

      // 处理换色像素（免费）
      if (hasRecolor) {
        const pixelsToRecolor = ownedPixels.map(pixel => ({
          x: pixel.x,
          y: pixel.y,
          color: selectedColor
        }));

        const recolorResult = await recolorPixelsBatch(
          walletAddress,
          pixelsToRecolor
        );

        totalSuccess += recolorResult.successCount;
        totalError += recolorResult.errorCount;

        // 更新换色成功的像素
        if (recolorResult.successCount > 0) {
          ownedPixels.forEach(pixel => {
            useGameStore.getState().updatePixel(
              pixel.x,
              pixel.y,
              {
                color: selectedColor,
              }
            );
          });
        }
      }

      toast.dismiss(loadingToast);

      // 显示结果
      if (totalError === 0) {
        // 全部成功
        toast.success('🎉 操作成功！', {
          description: (
            <div className="space-y-1">
              {totalSuccess > 0 && <div>✅ 占领: {totalSuccess} 个像素</div>}
              {totalSkipped > 0 && <div>⏭️ 跳过: {totalSkipped} 个 (已拥有)</div>}
              {hasRecolor && <div>🎨 换色: {ownedPixels.length} 个像素</div>}
              {totalPaid > 0 && <div>💰 总支付: {formatPrice(totalPaid)} USDC</div>}
            </div>
          ),
          duration: 5000
        });
        clearSelection();
        onClose();
      } else if (totalSuccess > 0 || totalSkipped > 0) {
        // 部分成功
        toast.warning('⚠️ 部分成功', {
          description: (
            <div className="space-y-1">
              {totalSuccess > 0 && <div>✅ 成功: {totalSuccess} 个</div>}
              {totalSkipped > 0 && <div>⏭️ 跳过: {totalSkipped} 个 (已拥有)</div>}
              {totalError > 0 && <div>❌ 失败: {totalError} 个</div>}
              {totalPaid > 0 && <div>💰 支付: {formatPrice(totalPaid)} USDC</div>}
            </div>
          ),
          duration: 6000
        });
        clearSelection();
        onClose();
      } else {
        // 全部失败
        toast.error('❌ 操作失败', {
          description: '所有像素操作都失败了',
          duration: 5000
        });
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('批量占领失败:', error);
      toast.error('批量占领失败', {
        description: error instanceof Error ? error.message : '未知错误'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>批量占领像素</DialogTitle>
          <DialogDescription>
            一次性占领 {conquerable.length} 个像素
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 统计信息 */}
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="bg-gray-900 border border-gray-800 rounded p-3 text-center">
              <p className="text-cyber-white/50 mb-1">已选择</p>
              <p className="text-2xl font-bold text-cyan-400">{stats.total}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded p-3 text-center">
              <p className="text-cyber-white/50 mb-1">可占领</p>
              <p className="text-2xl font-bold text-green-400">{stats.available}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded p-3 text-center">
              <p className="text-cyber-white/50 mb-1">已拥有</p>
              <p className="text-2xl font-bold text-gray-400">{stats.owned}</p>
            </div>
          </div>

          {/* 价格信息 */}
          <div className="bg-gray-900 border border-gray-800 rounded p-4 space-y-3">
            <p className="font-semibold mb-2">💰 批量占领费用</p>

            {conquerable.length > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-cyber-white/70">占领 {conquerable.length} 个像素：</span>
                  <span className="font-mono font-bold">{formatPrice(conquerablePrice)} USDC</span>
                </div>

                <div className="border-t border-gray-700 pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-cyber-white/70">当前余额：</span>
                    <span className="font-mono">{formatPrice(balance)} USDC</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-cyber-white/70">占领后余额：</span>
                    <span className={`font-mono ${balance >= conquerablePrice ? 'text-green-400' : 'text-red-400'}`}>
                      {formatPrice(Math.max(0, balance - conquerablePrice))} USDC
                    </span>
                  </div>
                </div>
              </>
            )}

            {conquerable.length === 0 && (
              <p className="text-sm text-gray-400">你已拥有所有选中的像素</p>
            )}
          </div>

          {/* 颜色选择器 */}
          <div>
            <p className="text-sm font-semibold mb-3">选择统一颜色</p>
            <ColorPicker color={selectedColor} onChange={setSelectedColor} />
            <p className="text-xs text-gray-400 mt-2">
              所有被占领的像素将使用这个颜色
            </p>
          </div>

          {/* 预览 */}
          <div className="flex items-center gap-3 p-3 bg-gray-900 border border-gray-800 rounded">
            <div
              className="w-16 h-16 rounded border-2 border-gray-600"
              style={{ backgroundColor: selectedColor }}
            />
            <div className="flex-1">
              <p className="text-sm font-medium">占领后颜色预览</p>
              <p className="text-xs text-gray-400 font-mono mt-1">{selectedColor}</p>
            </div>
          </div>

          {/* 警告信息 */}
          {conquerable.length > 0 && balance < conquerablePrice && (
            <div className="bg-red-900/20 border border-red-500/50 rounded p-3 text-sm text-red-400">
              ⚠️ 余额不足！需要 {formatPrice(conquerablePrice - balance)} USDC 更多代币
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
          >
            取消
          </Button>
          <Button
            onClick={handleConquer}
            disabled={(!canConquer && !canRecolor) || isProcessing}
            className="min-w-[140px]"
          >
            {isProcessing
              ? '处理中...'
              : !connected
              ? '需要登录'
              : conquerable.length > 0 && ownedPixels.length > 0
              ? `占领 ${conquerable.length} + 换色 ${ownedPixels.length}`
              : conquerable.length > 0
              ? balance < conquerablePrice
                ? '余额不足'
                : `占领 ${conquerable.length} 个 (${formatPrice(conquerablePrice)} USDC)`
              : ownedPixels.length > 0
              ? `🎨 换色 ${ownedPixels.length} 个 (免费)`
              : '没有像素'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
