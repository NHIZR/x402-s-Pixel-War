'use client';

import { useLanguage } from '@/lib/i18n';
import { ColorPicker } from '../ColorPicker';
import type { PurchaseMode } from './ModeSelector';

interface ColorSelectorProps {
  textColor: string;
  bgColor: string;
  purchaseMode: PurchaseMode;
  onTextColorChange: (color: string) => void;
  onBgColorChange: (color: string) => void;
}

export function ColorSelector({
  textColor,
  bgColor,
  purchaseMode,
  onTextColorChange,
  onBgColorChange,
}: ColorSelectorProps) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          {t('textColor')}
        </label>
        <ColorPicker color={textColor} onChange={onTextColorChange} />
      </div>

      {purchaseMode === 'fullCover' && (
        <div>
          <label className="block text-sm font-medium mb-2">
            {t('backgroundColor')}
          </label>
          <ColorPicker color={bgColor} onChange={onBgColorChange} />
        </div>
      )}
    </div>
  );
}
