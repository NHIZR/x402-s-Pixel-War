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
import { useTransactionStore } from '@/lib/stores/transactionStore';
import { useLanguage } from '@/lib/i18n';

interface BatchConquerModalProps {
  open: boolean;
  onClose: () => void;
}

export function BatchConquerModal({ open, onClose }: BatchConquerModalProps) {
  const { connected, publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { walletAddress, balance } = useUserStore();
  const { selectedPixels, clearSelection } = useGameStore();
  const { addTransaction } = useTransactionStore();
  const { t } = useLanguage();
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
      toast.error(t('connectWalletFirst'), {
        description: t('needSolanaWalletBatch')
      });
      return;
    }

    if (conquerable.length === 0 && ownedPixels.length === 0) {
      toast.warning(t('noPixelsSelected'), {
        description: t('selectPixelsFirst')
      });
      return;
    }

    if (conquerable.length > 0 && balance < conquerablePrice) {
      toast.error(t('insufficientBalance'), {
        description: `${t('youPay')} ${formatPrice(conquerablePrice)} USDC, ${t('currentBalanceColon')} ${formatPrice(balance)} USDC`
      });
      return;
    }

    setIsProcessing(true);

    const hasConquer = conquerable.length > 0;
    const hasRecolor = ownedPixels.length > 0;

    let loadingMessage = '';
    if (hasConquer && hasRecolor) {
      loadingMessage = t('processing');
    } else if (hasConquer) {
      loadingMessage = t('processing');
    } else {
      loadingMessage = t('processing');
    }

    const loadingToast = toast.loading(loadingMessage, {
      description: hasConquer ? `${t('totalPaid', { n: formatPrice(conquerablePrice) })}` : t('freeRecolorNote')
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

          // 添加交易记录
          addTransaction({
            type: 'batch_conquer',
            pixelCount: conquerResult.successCount,
            amount: conquerResult.totalPaid,
            txHash: conquerResult.txHash || '',
            status: 'confirmed',
          });
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
        toast.success(`🎉 ${t('operationSuccess')}`, {
          description: (
            <div className="space-y-1">
              {totalSuccess > 0 && <div>✅ {t('conqueredCount', { n: totalSuccess })}</div>}
              {totalSkipped > 0 && <div>⏭️ {t('skippedCount', { n: totalSkipped })}</div>}
              {hasRecolor && <div>🎨 {t('recoloredCount', { n: ownedPixels.length })}</div>}
              {totalPaid > 0 && <div>💰 {t('totalPaid', { n: formatPrice(totalPaid) })}</div>}
            </div>
          ),
          duration: 5000
        });
        clearSelection();
        onClose();
      } else if (totalSuccess > 0 || totalSkipped > 0) {
        // 部分成功
        toast.warning(`⚠️ ${t('partialSuccess')}`, {
          description: (
            <div className="space-y-1">
              {totalSuccess > 0 && <div>✅ {t('successCount', { n: totalSuccess })}</div>}
              {totalSkipped > 0 && <div>⏭️ {t('skippedCount', { n: totalSkipped })}</div>}
              {totalError > 0 && <div>❌ {t('failedCount', { n: totalError })}</div>}
              {totalPaid > 0 && <div>💰 {t('totalPaid', { n: formatPrice(totalPaid) })}</div>}
            </div>
          ),
          duration: 6000
        });
        clearSelection();
        onClose();
      } else {
        // 全部失败
        toast.error(`❌ ${t('operationFailed')}`, {
          description: t('allPixelsFailed'),
          duration: 5000
        });
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('批量占领失败:', error);
      toast.error(t('batchConquestFailed'), {
        description: error instanceof Error ? error.message : t('errorOccurred')
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('batchConquest')}</DialogTitle>
          <DialogDescription>
            {t('conquerNPixels', { n: conquerable.length })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 统计信息 */}
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="bg-gray-900 border border-gray-800 rounded p-3 text-center">
              <p className="text-cyber-white/50 mb-1">{t('selected')}</p>
              <p className="text-2xl font-bold text-cyan-400">{stats.total}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded p-3 text-center">
              <p className="text-cyber-white/50 mb-1">{t('canConquer')}</p>
              <p className="text-2xl font-bold text-green-400">{stats.available}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded p-3 text-center">
              <p className="text-cyber-white/50 mb-1">{t('owned')}</p>
              <p className="text-2xl font-bold text-gray-400">{stats.owned}</p>
            </div>
          </div>

          {/* 价格信息 */}
          <div className="bg-gray-900 border border-gray-800 rounded p-4 space-y-3">
            <p className="font-semibold mb-2">💰 {t('batchCost')}</p>

            {conquerable.length > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-cyber-white/70">{t('conquerNPixelsColon', { n: conquerable.length })}</span>
                  <span className="font-mono font-bold">{formatPrice(conquerablePrice)} USDC</span>
                </div>

                <div className="border-t border-gray-700 pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-cyber-white/70">{t('currentBalanceColon')}</span>
                    <span className="font-mono">{formatPrice(balance)} USDC</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-cyber-white/70">{t('afterConquestBalanceColon')}</span>
                    <span className={`font-mono ${balance >= conquerablePrice ? 'text-green-400' : 'text-red-400'}`}>
                      {formatPrice(Math.max(0, balance - conquerablePrice))} USDC
                    </span>
                  </div>
                </div>
              </>
            )}

            {conquerable.length === 0 && (
              <p className="text-sm text-gray-400">{t('youOwnAllSelected')}</p>
            )}
          </div>

          {/* 颜色选择器 */}
          <div>
            <p className="text-sm font-semibold mb-3">{t('selectUnifiedColor')}</p>
            <ColorPicker color={selectedColor} onChange={setSelectedColor} />
            <p className="text-xs text-gray-400 mt-2">
              {t('allConqueredPixelsUseThisColor')}
            </p>
          </div>

          {/* 预览 */}
          <div className="flex items-center gap-3 p-3 bg-gray-900 border border-gray-800 rounded">
            <div
              className="w-16 h-16 rounded border-2 border-gray-600"
              style={{ backgroundColor: selectedColor }}
            />
            <div className="flex-1">
              <p className="text-sm font-medium">{t('colorPreview')}</p>
              <p className="text-xs text-gray-400 font-mono mt-1">{selectedColor}</p>
            </div>
          </div>

          {/* 警告信息 */}
          {conquerable.length > 0 && balance < conquerablePrice && (
            <div className="bg-red-900/20 border border-red-500/50 rounded p-3 text-sm text-red-400">
              ⚠️ {t('insufficientNeedMore', { n: formatPrice(conquerablePrice - balance) })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleConquer}
            disabled={(!canConquer && !canRecolor) || isProcessing}
            className="min-w-[140px]"
          >
            {isProcessing
              ? t('processing')
              : !connected
              ? t('needLogin')
              : conquerable.length > 0 && ownedPixels.length > 0
              ? t('conquerNPlusRecolorM', { n: conquerable.length, m: ownedPixels.length })
              : conquerable.length > 0
              ? balance < conquerablePrice
                ? t('insufficientBalance')
                : t('conquerNFor', { n: conquerable.length, price: formatPrice(conquerablePrice) })
              : ownedPixels.length > 0
              ? `🎨 ${t('recolorNFree', { n: ownedPixels.length })}`
              : t('noPixels')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
