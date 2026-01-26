'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { toast } from 'sonner';
import { Type, Move, Minus, Plus } from 'lucide-react';
import { useGameStore } from '@/lib/stores/gameStore';
import { useUserStore } from '@/lib/stores/userStore';
import { useTransactionStore } from '@/lib/stores/transactionStore';
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

interface TextToolModalProps {
  open: boolean;
  onClose: () => void;
}

type InputMode = 'text' | 'single';
type PurchaseMode = 'textOnly' | 'fullCover';

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
  const [textColor, setTextColor] = useState('#FF0000');
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
    const newX = Math.max(0, Math.floor((64 - textSize.width) / 2));
    const newY = Math.max(0, Math.floor((36 - textSize.height) / 2));
    setPosX(newX);
    setPosY(newY);
  }, [textSize]);

  // 文字变化时自动居中
  useEffect(() => {
    if (text) {
      centerText();
    }
  }, [text, charWidth, charHeight, centerText]);

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

        // 更新本地状态
        if (conquerResult.successCount > 0) {
          for (const p of toConquer.slice(0, conquerResult.successCount)) {
            const pixel = pixels[p.y]?.[p.x];
            if (pixel) {
              useGameStore.getState().updatePixel(p.x, p.y, {
                color: p.color,
                currentPrice: pixel.currentPrice * 1.2,
                ownerId: walletAddress,
                conquestCount: pixel.conquestCount + 1,
                lastConqueredAt: new Date().toISOString(),
              });
            }
          }

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
          for (const p of toRecolor) {
            useGameStore.getState().updatePixel(p.x, p.y, { color: p.color });
          }
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('textOnlyAZ')}
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value.toUpperCase().replace(/[^A-Z ]/g, ''))}
              placeholder={t('enterText')}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:border-cyan-400 focus:outline-none"
              maxLength={20}
            />
          </div>

          {/* 输入模式切换 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('inputMode')}
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setInputMode('text')}
                className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                  inputMode === 'text'
                    ? 'bg-cyan-600 border-cyan-400 text-white'
                    : 'bg-gray-900 border-gray-700 hover:border-gray-600'
                }`}
              >
                {t('textMode')}
              </button>
              <button
                onClick={() => setInputMode('single')}
                className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                  inputMode === 'single'
                    ? 'bg-cyan-600 border-cyan-400 text-white'
                    : 'bg-gray-900 border-gray-700 hover:border-gray-600'
                }`}
              >
                {t('singleLetter')}
              </button>
            </div>
          </div>

          {/* 购买模式 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('purchaseModeTool')}
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setPurchaseMode('textOnly')}
                className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                  purchaseMode === 'textOnly'
                    ? 'bg-cyan-600 border-cyan-400 text-white'
                    : 'bg-gray-900 border-gray-700 hover:border-gray-600'
                }`}
              >
                {t('textOnly')}
              </button>
              <button
                onClick={() => setPurchaseMode('fullCover')}
                className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                  purchaseMode === 'fullCover'
                    ? 'bg-cyan-600 border-cyan-400 text-white'
                    : 'bg-gray-900 border-gray-700 hover:border-gray-600'
                }`}
              >
                {t('fullCover')}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {purchaseMode === 'textOnly' ? t('textOnlyDesc') : t('fullCoverDesc')}
            </p>
          </div>

          {/* 尺寸控制 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('size')}
            </label>

            {/* 预设尺寸 */}
            <div className="flex gap-2 mb-3">
              {(Object.keys(FONT_SIZES) as FontSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    setSizePreset(size);
                    setUseCustomSize(false);
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors ${
                    !useCustomSize && sizePreset === size
                      ? 'bg-cyan-600 border-cyan-400 text-white'
                      : 'bg-gray-900 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  {size === 'small' ? t('small') : size === 'medium' ? t('medium') : t('large')}
                  <span className="text-xs opacity-70 ml-1">
                    ({FONT_SIZES[size].width}x{FONT_SIZES[size].height})
                  </span>
                </button>
              ))}
            </div>

            {/* 自定义尺寸 */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">
                  {t('customSize')}
                </span>
                <button
                  onClick={() => setUseCustomSize(!useCustomSize)}
                  className={`px-2 py-1 text-xs rounded ${
                    useCustomSize
                      ? 'bg-cyan-600 text-white'
                      : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {useCustomSize ? t('on') : t('off')}
                </button>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs text-gray-500">
                    {t('width')}
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => setCustomWidth(Math.max(3, customWidth - 1))}
                      disabled={!useCustomSize}
                      className="p-1 bg-gray-800 rounded disabled:opacity-50"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="flex-1 text-center font-mono">{customWidth}</span>
                    <button
                      onClick={() => setCustomWidth(Math.min(12, customWidth + 1))}
                      disabled={!useCustomSize}
                      className="p-1 bg-gray-800 rounded disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500">
                    {t('height')}
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => setCustomHeight(Math.max(5, customHeight - 1))}
                      disabled={!useCustomSize}
                      className="p-1 bg-gray-800 rounded disabled:opacity-50"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="flex-1 text-center font-mono">{customHeight}</span>
                    <button
                      onClick={() => setCustomHeight(Math.min(16, customHeight + 1))}
                      disabled={!useCustomSize}
                      className="p-1 bg-gray-800 rounded disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 位置控制 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Move className="w-4 h-4" />
                {t('position')}
              </label>
              <button
                onClick={centerText}
                className="text-xs px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded"
              >
                {t('center')}
              </button>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs text-gray-500">X</label>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, 64 - textSize.width)}
                  value={posX}
                  onChange={(e) => setPosX(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-center text-sm font-mono">{posX}</div>
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500">Y</label>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, 36 - textSize.height)}
                  value={posY}
                  onChange={(e) => setPosY(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-center text-sm font-mono">{posY}</div>
              </div>
            </div>
          </div>

          {/* 颜色选择 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('textColor')}
              </label>
              <ColorPicker color={textColor} onChange={setTextColor} />
            </div>

            {purchaseMode === 'fullCover' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t('backgroundColor')}
                </label>
                <ColorPicker color={bgColor} onChange={setBgColor} />
              </div>
            )}
          </div>

          {/* 预览 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('preview')}
            </label>
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 overflow-auto">
              <div
                className="grid gap-0 mx-auto"
                style={{
                  gridTemplateColumns: 'repeat(64, 6px)',
                  width: 'fit-content',
                }}
              >
                {Array.from({ length: 36 }).map((_, y) =>
                  Array.from({ length: 64 }).map((_, x) => {
                    const previewPixel = previewPixels.pixels.find(
                      (p) => p.x === x && p.y === y
                    );
                    const isText = previewPixel?.isText;
                    const isBg = previewPixel && !previewPixel.isText;

                    let bgColorStyle = '#1a1a2e';
                    if (isText) bgColorStyle = textColor;
                    else if (isBg) bgColorStyle = bgColor;

                    return (
                      <div
                        key={`${x}-${y}`}
                        className="w-[6px] h-[6px]"
                        style={{ backgroundColor: bgColorStyle }}
                      />
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* 价格信息 */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">
                  {t('pixelsToConquer')}
                </span>
                <span className="ml-2 font-bold text-cyan-400">
                  {priceInfo.toConquerCount}
                </span>
              </div>
              <div>
                <span className="text-gray-400">
                  {t('ownedFreeRecolor')}
                </span>
                <span className="ml-2 font-bold text-green-400">
                  {priceInfo.ownedCount}
                </span>
              </div>
              <div className="col-span-2 pt-2 border-t border-gray-700">
                <span className="text-gray-400">
                  {t('totalCost')}
                </span>
                <span className="ml-2 font-bold text-xl text-cyan-400">
                  {formatPrice(priceInfo.totalPrice)} USDC
                </span>
              </div>
              {priceInfo.toConquerCount > 0 && (
                <div className="col-span-2">
                  <span className="text-gray-400">
                    {t('yourBalance')}
                  </span>
                  <span
                    className={`ml-2 font-mono ${
                      balance >= priceInfo.totalPrice
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}
                  >
                    {formatPrice(balance)} USDC
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 警告 */}
          {!isInBounds && text && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3 text-sm text-red-400">
              {t('textOutOfBounds')}
            </div>
          )}
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
