'use client';

import { useLanguage } from '@/lib/i18n';
import { formatPrice } from '@/lib/utils/priceCalculation';

interface PriceInfoProps {
  toConquerCount: number;
  ownedCount: number;
  totalPrice: number;
  balance: number;
  isInBounds: boolean;
  hasText: boolean;
}

export function PriceInfo({
  toConquerCount,
  ownedCount,
  totalPrice,
  balance,
  isInBounds,
  hasText,
}: PriceInfoProps) {
  const { t } = useLanguage();

  return (
    <>
      {/* 价格信息 */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">
              {t('pixelsToConquer')}
            </span>
            <span className="ml-2 font-bold text-cyan-400">
              {toConquerCount}
            </span>
          </div>
          <div>
            <span className="text-gray-400">
              {t('ownedFreeRecolor')}
            </span>
            <span className="ml-2 font-bold text-green-400">
              {ownedCount}
            </span>
          </div>
          <div className="col-span-2 pt-2 border-t border-gray-700">
            <span className="text-gray-400">
              {t('totalCost')}
            </span>
            <span className="ml-2 font-bold text-xl text-cyan-400">
              {formatPrice(totalPrice)} USDC
            </span>
          </div>
          {toConquerCount > 0 && (
            <div className="col-span-2">
              <span className="text-gray-400">
                {t('yourBalance')}
              </span>
              <span
                className={`ml-2 font-mono ${
                  balance >= totalPrice
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
      {!isInBounds && hasText && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3 text-sm text-red-400">
          {t('textOutOfBounds')}
        </div>
      )}
    </>
  );
}
