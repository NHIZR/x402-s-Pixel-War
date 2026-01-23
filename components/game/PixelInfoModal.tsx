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
  calculateSellerProfit,
  calculateWarTax,
} from '@/lib/utils/priceCalculation';
import { conquerPixel, recolorPixel } from '@/lib/services/pixelConquest';

export function PixelInfoModal() {
  const { connected } = useWallet();
  const { connection } = useConnection();
  const { walletAddress, balance } = useUserStore();
  const { selectedPixel, selectPixel } = useGameStore();
  const [selectedColor, setSelectedColor] = useState('#FF0000');
  const [isConquering, setIsConquering] = useState(false);

  if (!selectedPixel) return null;

  const open = selectedPixel !== null;
  const newPrice = calculateNewPrice(selectedPixel.currentPrice);
  const sellerProfit = calculateSellerProfit(selectedPixel.currentPrice);
  const warTax = calculateWarTax(selectedPixel.currentPrice);

  const handleConquer = async () => {
    if (!connected || !walletAddress) {
      toast.error('请先连接钱包', {
        description: '需要连接 Solana 钱包才能占领像素'
      });
      return;
    }

    const isOwner = selectedPixel.ownerId === walletAddress;

    // If user owns the pixel, recolor for free
    if (isOwner) {
      setIsConquering(true);

      const loadingToast = toast.loading('正在更换颜色...', {
        description: `坐标 (${selectedPixel.x}, ${selectedPixel.y})`
      });

      try {
        const result = await recolorPixel(
          walletAddress,
          selectedPixel.x,
          selectedPixel.y,
          selectedColor
        );

        toast.dismiss(loadingToast);

        if (result.success) {
          // Update local state
          if (result.pixel) {
            useGameStore.getState().updatePixel(
              selectedPixel.x,
              selectedPixel.y,
              {
                color: result.pixel.color,
              }
            );
          }

          toast.success('🎨 换色成功！', {
            description: (
              <div className="space-y-1">
                <div>坐标: ({selectedPixel.x}, {selectedPixel.y})</div>
                <div>新颜色: {selectedColor}</div>
                <div className="text-xs opacity-70">免费换色</div>
              </div>
            ),
            duration: 3000
          });
          selectPixel(null);
        } else {
          toast.error('换色失败', {
            description: result.error
          });
        }
      } catch (error) {
        toast.dismiss(loadingToast);
        console.error('Recolor error:', error);
        toast.error('发生错误', {
          description: error instanceof Error ? error.message : '未知错误'
        });
      } finally {
        setIsConquering(false);
      }
      return;
    }

    // Normal conquest flow (not owner)
    if (balance < selectedPixel.currentPrice) {
      toast.error('余额不足', {
        description: `需要 ${formatPrice(selectedPixel.currentPrice)} USDC，当前余额 ${formatPrice(balance)} USDC`
      });
      return;
    }

    setIsConquering(true);

    const loadingToast = toast.loading('正在占领像素...', {
      description: `坐标 (${selectedPixel.x}, ${selectedPixel.y})`
    });

    try {
      const result = await conquerPixel(
        connection,
        walletAddress,
        selectedPixel.x,
        selectedPixel.y,
        selectedColor,
        selectedPixel.currentPrice
      );

      toast.dismiss(loadingToast);

      if (result.success) {
        // 🔥 立即更新本地像素状态（不等实时同步）
        if (result.pixel) {
          useGameStore.getState().updatePixel(
            selectedPixel.x,
            selectedPixel.y,
            {
              color: result.pixel.color,
              currentPrice: result.pixel.newPrice,
              ownerId: walletAddress,
              conquestCount: selectedPixel.conquestCount + 1,
              lastConqueredAt: new Date().toISOString(),
            }
          );
        }

        // 🔥 立即扣除余额（模拟支付）
        const newBalance = balance - selectedPixel.currentPrice;
        useUserStore.getState().setBalance(newBalance);
        console.log('💰 余额更新:', {
          原余额: balance,
          支付: selectedPixel.currentPrice,
          新余额: newBalance
        });

        toast.success('🎉 占领成功！', {
          description: (
            <div className="space-y-1">
              <div>坐标: ({selectedPixel.x}, {selectedPixel.y})</div>
              <div>支付: {formatPrice(selectedPixel.currentPrice)} USDC</div>
              <div>新价格: {formatPrice(result.pixel?.newPrice || 0)} USDC</div>
              <div className="text-xs opacity-70">TX: {result.txHash?.substring(0, 12)}...</div>
            </div>
          ),
          duration: 5000
        });
        selectPixel(null); // Close modal
      } else {
        toast.error('占领失败', {
          description: result.error
        });
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Conquest error:', error);
      toast.error('发生错误', {
        description: error instanceof Error ? error.message : '未知错误'
      });
    } finally {
      setIsConquering(false);
    }
  };

  const isOwner = selectedPixel.ownerId === walletAddress;
  const canConquer = connected && balance >= selectedPixel.currentPrice;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && selectPixel(null)}>
      <DialogContent onClose={() => selectPixel(null)}>
        <DialogHeader>
          <DialogTitle>
            像素 ({selectedPixel.x}, {selectedPixel.y})
          </DialogTitle>
          <DialogDescription>
            {selectedPixel.ownerId ? '已被占领' : '未被占领'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 当前状态 */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-cyber-white/50 mb-1">当前价格</p>
              <p className="text-lg font-bold">{formatPrice(selectedPixel.currentPrice)} USDC</p>
            </div>
            <div>
              <p className="text-cyber-white/50 mb-1">占领次数</p>
              <p className="text-lg font-bold">{selectedPixel.conquestCount} 次</p>
            </div>
          </div>

          {/* 价格预测 */}
          <div className="bg-gray-900 border border-gray-800 rounded p-3 space-y-2 text-sm">
            <p className="font-semibold mb-2">💰 占领后的交易详情</p>
            <div className="flex justify-between">
              <span className="text-cyber-white/70">你支付：</span>
              <span className="font-mono">{formatPrice(selectedPixel.currentPrice)} USDC</span>
            </div>
            {selectedPixel.ownerId && (
              <div className="flex justify-between">
                <span className="text-cyber-white/70">前任获得：</span>
                <span className="font-mono text-green-400">+{formatPrice(sellerProfit)} USDC</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-cyber-white/70">战争税：</span>
              <span className="font-mono text-red-400">-{formatPrice(warTax)} USDC</span>
            </div>
            <div className="border-t border-gray-700 pt-2 mt-2 flex justify-between">
              <span className="text-cyber-white/70">新价格：</span>
              <span className="font-mono font-bold">{formatPrice(newPrice)} USDC</span>
            </div>
          </div>

          {/* 颜色选择器 */}
          <div>
            <p className="text-sm font-semibold mb-3">选择你的颜色</p>
            <ColorPicker color={selectedColor} onChange={setSelectedColor} />
          </div>

          {/* 当前颜色预览 */}
          <div className="flex items-center gap-3">
            <div
              className="w-16 h-16 rounded border-2 border-gray-600"
              style={{ backgroundColor: selectedPixel.color }}
            />
            <div className="text-xs text-cyber-white/50">
              <p>当前颜色</p>
              <p className="font-mono mt-1">{selectedPixel.color}</p>
            </div>

            <div className="text-cyber-white/50 text-xl">→</div>

            <div
              className="w-16 h-16 rounded border-2 border-gray-600"
              style={{ backgroundColor: selectedColor }}
            />
            <div className="text-xs text-cyber-white/50">
              <p>占领后颜色</p>
              <p className="font-mono mt-1">{selectedColor}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => selectPixel(null)}
          >
            取消
          </Button>
          <Button
            onClick={handleConquer}
            disabled={!connected || isConquering}
            className="min-w-[120px]"
          >
            {isConquering
              ? (isOwner ? '换色中...' : '占领中...')
              : !connected
              ? '需要登录'
              : isOwner
              ? '🎨 免费换色'
              : balance < selectedPixel.currentPrice
              ? '余额不足'
              : `占领 (${formatPrice(selectedPixel.currentPrice)} USDC)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
