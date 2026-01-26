'use client';

import { useLanguage } from '@/lib/i18n';

interface TextInputProps {
  text: string;
  onTextChange: (text: string) => void;
}

export function TextInput({ text, onTextChange }: TextInputProps) {
  const { t } = useLanguage();

  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        {t('textOnlyAZ')}
      </label>
      <input
        type="text"
        value={text}
        onChange={(e) => onTextChange(e.target.value.toUpperCase().replace(/[^A-Z ]/g, ''))}
        placeholder={t('enterText')}
        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:border-cyan-400 focus:outline-none"
        maxLength={20}
      />
    </div>
  );
}
