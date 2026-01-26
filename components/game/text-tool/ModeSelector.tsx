'use client';

import { useLanguage } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export type InputMode = 'text' | 'single';
export type PurchaseMode = 'textOnly' | 'fullCover';

interface ModeSelectorProps {
  inputMode: InputMode;
  purchaseMode: PurchaseMode;
  onInputModeChange: (mode: InputMode) => void;
  onPurchaseModeChange: (mode: PurchaseMode) => void;
}

// 紧凑按钮组件
interface ModeButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function ModeButton({ active, onClick, children }: ModeButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1 text-sm rounded border transition-colors',
        active
          ? 'bg-cyan-600 border-cyan-400 text-white'
          : 'bg-gray-900 border-gray-700 hover:border-gray-500 text-gray-300'
      )}
    >
      {children}
    </button>
  );
}

export function ModeSelector({
  inputMode,
  purchaseMode,
  onInputModeChange,
  onPurchaseModeChange,
}: ModeSelectorProps) {
  const { t } = useLanguage();

  return (
    <div className="flex items-center gap-6 flex-wrap">
      {/* 输入模式切换 */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">{t('inputMode')}:</span>
        <div className="flex gap-1">
          <ModeButton
            active={inputMode === 'text'}
            onClick={() => onInputModeChange('text')}
          >
            {t('textMode')}
          </ModeButton>
          <ModeButton
            active={inputMode === 'single'}
            onClick={() => onInputModeChange('single')}
          >
            {t('singleLetter')}
          </ModeButton>
        </div>
      </div>

      {/* 购买模式 */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">{t('purchaseModeTool')}:</span>
        <div className="flex gap-1">
          <ModeButton
            active={purchaseMode === 'textOnly'}
            onClick={() => onPurchaseModeChange('textOnly')}
          >
            {t('textOnly')}
          </ModeButton>
          <ModeButton
            active={purchaseMode === 'fullCover'}
            onClick={() => onPurchaseModeChange('fullCover')}
          >
            {t('fullCover')}
          </ModeButton>
        </div>
        <span className="text-xs text-gray-500">
          ({purchaseMode === 'textOnly' ? t('textOnlyDesc') : t('fullCoverDesc')})
        </span>
      </div>
    </div>
  );
}
