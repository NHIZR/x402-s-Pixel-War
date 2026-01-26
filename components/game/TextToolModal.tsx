'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { toast } from 'sonner';
import { Type } from 'lucide-react';
import { useGameStore } from '@/lib/stores/gameStore';
import { useUserStore } from '@/lib/stores/userStore';
import { useTransactionStore } from '@/lib/stores/transactionStore';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatPrice } from '@/lib/utils/priceCalculation';
import { conquerPixelsBatch, recolorPixelsBatch } from '@/lib/services/pixelConquest';
import { useLanguage } from '@/lib/i18n';
import {
  renderText,
  calculateTextSize,
  isTextInBounds,
  FONT_SIZES,
  type FontSize,
} from '@/lib/fonts/pixelFont';
import { GRID_WIDTH, GRID_HEIGHT } from '@/lib/constants/game';

// 子组件
import {
  TextInput,
  ModeSelector,
  ColorSelector,
  PreviewCanvas,
  PriceInfo,
  type InputMode,
  type PurchaseMode,
} from './text-tool';

interface TextToolModalProps {
  open: boolean;
  onClose: () => void;
}

// 尺寸常量
const MIN_CHAR_WIDTH = 5;
const MIN_CHAR_HEIGHT = 7;
const MAX_CHAR_WIDTH = 32;
const MAX_CHAR_HEIGHT = 36;

export function TextToolModal({ open, onClose }: TextToolModalProps) {
  const { connected, publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { walletAddress, balance } = useUserStore();
  const { pixels } = useGameStore();
  const { addTransaction } = useTransactionStore();
  const { t } = useLanguage();

  // 输入状态
  const [text, setText] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('text');
  const [purchaseMode, setPurchaseMode] = useState<PurchaseMode>('textOnly');

  // 尺寸控制
  const [sizePreset, setSizePreset] = useState<FontSize>('medium');
  const [customWidth, setCustomWidth] = useState<number>(FONT_SIZES.medium.width);
  const [customHeight, setCustomHeight] = useState<number>(FONT_SIZES.medium.height);
  const [useCustomSize, setUseCustomSize] = useState(false);

  // 位置控制
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);

  // 颜色
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [bgColor, setBgColor] = useState('#000000');

  // 处理状态
  const [isProcessing, setIsProcessing] = useState(false);

  // 当前字体尺寸
  const charWidth = useCustomSize ? customWidth : FONT_SIZES[sizePreset].width;
  const charHeight = useCustomSize ? customHeight : FONT_SIZES[sizePreset].height;

  // 计算文字尺寸
  const textSize = useMemo(() => {
    return calculateTextSize(text, charWidth, charHeight);
  }, [text, charWidth, charHeight]);

  // 渲染预览像素
  const previewPixels = useMemo(() => {
    if (!text) return { pixels: [], textPixelCount: 0, totalPixelCount: 0 };
    return renderText(
      text,
      posX,
      posY,
      charWidth,
      charHeight,
      1,
      purchaseMode === 'fullCover'
    );
  }, [text, posX, posY, charWidth, charHeight, purchaseMode]);

  // 检查是否在边界内
  const isInBounds = useMemo(() => {
    return isTextInBounds(posX, posY, textSize.width, textSize.height);
  }, [posX, posY, textSize]);

  // 计算价格
  const priceInfo = useMemo(() => {
    if (!pixels || pixels.length === 0) {
      return { totalPrice: 0, ownedCount: 0, toConquerCount: 0, toRecolorCount: 0 };
    }

    let totalPrice = 0;
    let ownedCount = 0;
    let toConquerCount = 0;

    for (const p of previewPixels.pixels) {
      const pixel = pixels[p.y]?.[p.x];
      if (!pixel) continue;

      if (pixel.ownerId === walletAddress) {
        ownedCount++;
      } else {
        toConquerCount++;
        totalPrice += pixel.currentPrice;
      }
    }

    return {
      totalPrice,
      ownedCount,
      toConquerCount,
      toRecolorCount: ownedCount,
    };
  }, [previewPixels.pixels, pixels, walletAddress]);

  // 更新预设尺寸时同步自定义尺寸
  useEffect(() => {
    if (!useCustomSize) {
      setCustomWidth(FONT_SIZES[sizePreset].width);
      setCustomHeight(FONT_SIZES[sizePreset].height);
    }
  }, [sizePreset, useCustomSize]);

  // 重置位置到画布中央
  const centerText = useCallback(() => {
    const newX = Math.max(0, Math.floor((GRID_WIDTH - textSize.width) / 2));
    const newY = Math.max(0, Math.floor((GRID_HEIGHT - textSize.height) / 2));
    setPosX(newX);
    setPosY(newY);
  }, [textSize]);

  // 文字变化时自动居中
  useEffect(() => {
    if (text) {
      centerText();
    }
  }, [text, charWidth, charHeight, centerText]);

  // 缩放字体大小
  const handleScaleUp = useCallback(() => {
    if (!useCustomSize) {
      setUseCustomSize(true);
    }
    setCustomWidth(Math.min(MAX_CHAR_WIDTH, customWidth + 1));
    setCustomHeight(Math.min(MAX_CHAR_HEIGHT, customHeight + Math.round(7/5)));
  }, [useCustomSize, customWidth, customHeight]);

  const handleScaleDown = useCallback(() => {
    if (!useCustomSize) {
      setUseCustomSize(true);
    }
    setCustomWidth(Math.max(MIN_CHAR_WIDTH, customWidth - 1));
    setCustomHeight(Math.max(MIN_CHAR_HEIGHT, customHeight - Math.round(7/5)));
  }, [useCustomSize, customWidth, customHeight]);

  // 位置变更处理
  const handlePositionChange = useCallback((x: number, y: number) => {
    setPosX(x);
    setPosY(y);
  }, []);

  // 处理购买
  const handlePurchase = async () => {
    if (!connected || !walletAddress || !publicKey) {
      toast.error(t('connectWalletFirst'));
      return;
    }

    if (!text) {
      toast.error(t('enterText'));
      return;
    }

    if (!isInBounds) {
      toast.error(t('textOutOfBounds'));
      return;
    }

    if (priceInfo.toConquerCount > 0 && balance < priceInfo.totalPrice) {
      toast.error(t('insufficientBalance'));
      return;
    }

    setIsProcessing(true);

    const loadingToast = toast.loading(t('processing'));

    try {
      let totalSuccess = 0;
      let totalPaid = 0;

      // 分离需要占领的像素和需要换色的像素
      const toConquer: { x: number; y: number; color: string; price: number }[] = [];
      const toRecolor: { x: number; y: number; color: string }[] = [];

      for (const p of previewPixels.pixels) {
        const pixel = pixels[p.y]?.[p.x];
        if (!pixel) continue;

        const color = p.isText ? textColor : bgColor;

        if (pixel.ownerId === walletAddress) {
          toRecolor.push({ x: p.x, y: p.y, color });
        } else {
          toConquer.push({ x: p.x, y: p.y, color, price: pixel.currentPrice });
        }
      }

      // 处理占领
      if (toConquer.length > 0) {
        const conquerResult = await conquerPixelsBatch(
          connection,
          publicKey,
          sendTransaction,
          toConquer,
          priceInfo.totalPrice
        );

        totalSuccess += conquerResult.successCount;
        totalPaid += conquerResult.totalPaid;

        // 使用批量更新优化
        if (conquerResult.successCount > 0) {
          const updates = toConquer.slice(0, conquerResult.successCount).map(p => {
            const pixel = pixels[p.y]?.[p.x];
            return {
              x: p.x,
              y: p.y,
              data: {
                color: p.color,
                currentPrice: pixel ? pixel.currentPrice * 1.2 : p.price * 1.2,
                ownerId: walletAddress,
                conquestCount: pixel ? pixel.conquestCount + 1 : 1,
                lastConqueredAt: new Date().toISOString(),
              }
            };
          });
          useGameStore.getState().updatePixelsBatch(updates);

          useUserStore.getState().setBalance(balance - conquerResult.totalPaid);

          addTransaction({
            type: 'batch_conquer',
            pixelCount: conquerResult.successCount,
            amount: conquerResult.totalPaid,
            txHash: conquerResult.txHash || '',
            status: 'confirmed',
          });
        }
      }

      // 处理换色
      if (toRecolor.length > 0) {
        const recolorResult = await recolorPixelsBatch(walletAddress, toRecolor);

        totalSuccess += recolorResult.successCount;

        if (recolorResult.successCount > 0) {
          const updates = toRecolor.map(p => ({
            x: p.x,
            y: p.y,
            data: { color: p.color }
          }));
          useGameStore.getState().updatePixelsBatch(updates);
        }
      }

      toast.dismiss(loadingToast);

      if (totalSuccess > 0) {
        toast.success(t('textDrawn'), {
          description: (
            <div className="space-y-1">
              <div>{t('textLabel')} &quot;{text}&quot;</div>
              {totalPaid > 0 && <div>{t('totalPaid', { n: formatPrice(totalPaid) })}</div>}
            </div>
          ),
        });
        onClose();
      } else {
        toast.error(t('operationFailed'));
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('Text tool error:', error);
      toast.error(t('errorOccurred'));
    } finally {
      setIsProcessing(false);
    }
  };

  const canPurchase =
    connected &&
    text &&
    isInBounds &&
    (priceInfo.toConquerCount === 0 || balance >= priceInfo.totalPrice);

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Type className="w-5 h-5" />
            {t('textTool')}
          </DialogTitle>
          <DialogDescription>
            {t('textToolDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 文字输入 */}
          <TextInput text={text} onTextChange={setText} />

          {/* 模式选择 */}
          <ModeSelector
            inputMode={inputMode}
            purchaseMode={purchaseMode}
            onInputModeChange={setInputMode}
            onPurchaseModeChange={setPurchaseMode}
          />

          {/* 颜色选择 */}
          <ColorSelector
            textColor={textColor}
            bgColor={bgColor}
            purchaseMode={purchaseMode}
            onTextColorChange={setTextColor}
            onBgColorChange={setBgColor}
          />

          {/* 交互式预览 */}
          <PreviewCanvas
            text={text}
            posX={posX}
            posY={posY}
            textSize={textSize}
            charWidth={charWidth}
            charHeight={charHeight}
            textColor={textColor}
            bgColor={bgColor}
            previewPixels={previewPixels.pixels}
            pixels={pixels}
            onPositionChange={handlePositionChange}
            onScaleUp={handleScaleUp}
            onScaleDown={handleScaleDown}
            onCenter={centerText}
          />

          {/* 价格信息 */}
          <PriceInfo
            toConquerCount={priceInfo.toConquerCount}
            ownedCount={priceInfo.ownedCount}
            totalPrice={priceInfo.totalPrice}
            balance={balance}
            isInBounds={isInBounds}
            hasText={!!text}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            {t('cancel')}
          </Button>
          <Button
            onClick={handlePurchase}
            disabled={!canPurchase || isProcessing}
            className="min-w-[140px]"
          >
            {isProcessing
              ? t('processing')
              : !connected
              ? t('needLogin')
              : !text
              ? t('enterText')
              : !isInBounds
              ? t('textOutOfBounds')
              : balance < priceInfo.totalPrice && priceInfo.toConquerCount > 0
              ? t('insufficientBalance')
              : `${t('draw')} (${formatPrice(priceInfo.totalPrice)} USDC)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
