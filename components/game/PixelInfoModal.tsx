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
import { useTransactionStore } from '@/lib/stores/transactionStore';
import { useLanguage } from '@/lib/i18n';

export function PixelInfoModal() {
  const { connected, publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { walletAddress, balance } = useUserStore();
  const { selectedPixel, selectPixel } = useGameStore();
  const { addTransaction } = useTransactionStore();
  const { t } = useLanguage();
  const [selectedColor, setSelectedColor] = useState('#FF0000');
  const [isConquering, setIsConquering] = useState(false);

  if (!selectedPixel) return null;

  const open = selectedPixel !== null;
  const newPrice = calculateNewPrice(selectedPixel.currentPrice);
  const sellerProfit = calculateSellerProfit(selectedPixel.currentPrice);
  const warTax = calculateWarTax(selectedPixel.currentPrice);

  const handleConquer = async () => {
    if (!connected || !walletAddress || !publicKey) {
      toast.error(t('connectWalletFirst'), {
        description: t('needSolanaWallet')
      });
      return;
    }

    const isOwner = selectedPixel.ownerId === walletAddress;

    // If user owns the pixel, recolor for free
    if (isOwner) {
      setIsConquering(true);

      const loadingToast = toast.loading(t('recoloring'), {
        description: `${t('coordinates')} (${selectedPixel.x}, ${selectedPixel.y})`
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

          toast.success(`🎨 ${t('recolorSuccess')}`, {
            description: (
              <div className="space-y-1">
                <div>{t('coordinates')} ({selectedPixel.x}, {selectedPixel.y})</div>
                <div>{t('newColorColon')} {selectedColor}</div>
                <div className="text-xs opacity-70">{t('freeRecolorNote')}</div>
              </div>
            ),
            duration: 3000
          });
          selectPixel(null);
        } else {
          toast.error(t('recolorFailed'), {
            description: result.error
          });
        }
      } catch (error) {
        toast.dismiss(loadingToast);
        console.error('Recolor error:', error);
        toast.error(t('errorOccurred'), {
          description: error instanceof Error ? error.message : t('errorOccurred')
        });
      } finally {
        setIsConquering(false);
      }
      return;
    }

    // Normal conquest flow (not owner)
    if (balance < selectedPixel.currentPrice) {
      toast.error(t('insufficientBalance'), {
        description: `${t('youPay')} ${formatPrice(selectedPixel.currentPrice)} USDC, ${t('currentBalanceColon')} ${formatPrice(balance)} USDC`
      });
      return;
    }

    setIsConquering(true);

    const loadingToast = toast.loading(t('conquering'), {
      description: `${t('coordinates')} (${selectedPixel.x}, ${selectedPixel.y})`
    });

    try {
      const result = await conquerPixel(
        connection,
        publicKey,
        sendTransaction,
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

        // 添加交易记录
        addTransaction({
          type: 'conquer',
          pixelX: selectedPixel.x,
          pixelY: selectedPixel.y,
          amount: selectedPixel.currentPrice,
          txHash: result.txHash || '',
          status: 'confirmed',
        });

        toast.success(`🎉 ${t('conquestSuccess')}`, {
          description: (
            <div className="space-y-1">
              <div>{t('coordinates')} ({selectedPixel.x}, {selectedPixel.y})</div>
              <div>{t('paid')} {formatPrice(selectedPixel.currentPrice)} USDC</div>
              <div>{t('newPrice')} {formatPrice(result.pixel?.newPrice || 0)} USDC</div>
              <div className="text-xs opacity-70">TX: {result.txHash?.substring(0, 12)}...</div>
            </div>
          ),
          duration: 5000
        });
        selectPixel(null); // Close modal
      } else {
        toast.error(t('conquestFailed'), {
          description: result.error
        });
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Conquest error:', error);
      toast.error(t('errorOccurred'), {
        description: error instanceof Error ? error.message : t('errorOccurred')
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
            {t('pixel')} ({selectedPixel.x}, {selectedPixel.y})
          </DialogTitle>
          <DialogDescription>
            {selectedPixel.ownerId ? t('conquered') : t('notConquered')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 当前状态 */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-cyber-white/50 mb-1">{t('currentPrice')}</p>
              <p className="text-lg font-bold">{formatPrice(selectedPixel.currentPrice)} USDC</p>
            </div>
            <div>
              <p className="text-cyber-white/50 mb-1">{t('conquestCount')}</p>
              <p className="text-lg font-bold">{selectedPixel.conquestCount} {t('times')}</p>
            </div>
          </div>

          {/* 价格预测 */}
          <div className="bg-gray-900 border border-gray-800 rounded p-3 space-y-2 text-sm">
            <p className="font-semibold mb-2">💰 {t('transactionDetails')}</p>
            <div className="flex justify-between">
              <span className="text-cyber-white/70">{t('youPay')}</span>
              <span className="font-mono">{formatPrice(selectedPixel.currentPrice)} USDC</span>
            </div>
            {selectedPixel.ownerId && (
              <div className="flex justify-between">
                <span className="text-cyber-white/70">{t('previousOwnerGets')}</span>
                <span className="font-mono text-green-400">+{formatPrice(sellerProfit)} USDC</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-cyber-white/70">{t('warTax')}</span>
              <span className="font-mono text-red-400">-{formatPrice(warTax)} USDC</span>
            </div>
            <div className="border-t border-gray-700 pt-2 mt-2 flex justify-between">
              <span className="text-cyber-white/70">{t('newPrice')}</span>
              <span className="font-mono font-bold">{formatPrice(newPrice)} USDC</span>
            </div>
          </div>

          {/* 颜色选择器 */}
          <div>
            <p className="text-sm font-semibold mb-3">{t('selectColor')}</p>
            <ColorPicker color={selectedColor} onChange={setSelectedColor} />
          </div>

          {/* 当前颜色预览 */}
          <div className="flex items-center gap-3">
            <div
              className="w-16 h-16 rounded border-2 border-gray-600"
              style={{ backgroundColor: selectedPixel.color }}
            />
            <div className="text-xs text-cyber-white/50">
              <p>{t('currentColor')}</p>
              <p className="font-mono mt-1">{selectedPixel.color}</p>
            </div>

            <div className="text-cyber-white/50 text-xl">→</div>

            <div
              className="w-16 h-16 rounded border-2 border-gray-600"
              style={{ backgroundColor: selectedColor }}
            />
            <div className="text-xs text-cyber-white/50">
              <p>{t('afterConquestColor')}</p>
              <p className="font-mono mt-1">{selectedColor}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => selectPixel(null)}
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleConquer}
            disabled={!connected || isConquering}
            className="min-w-[120px]"
          >
            {isConquering
              ? (isOwner ? t('recoloring') : t('conquering'))
              : !connected
              ? t('needLogin')
              : isOwner
              ? `🎨 ${t('freeRecolor')}`
              : balance < selectedPixel.currentPrice
              ? t('insufficientBalance')
              : `${t('conquer')} (${formatPrice(selectedPixel.currentPrice)} USDC)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
