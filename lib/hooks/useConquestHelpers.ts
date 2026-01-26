/**
 * Common helpers for pixel conquest operations
 */

import { toast } from 'sonner';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { useUserStore } from '@/lib/stores/userStore';
import { useLanguage } from '@/lib/i18n';
import { formatPrice } from '@/lib/utils/priceCalculation';

/**
 * Validate wallet connection and balance for conquest
 */
export function useConquestValidation() {
  const { connected, publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { walletAddress, balance } = useUserStore();
  const { t } = useLanguage();

  const validateWalletConnection = (): boolean => {
    if (!connected || !walletAddress || !publicKey) {
      toast.error(t('connectWalletFirst'), {
        description: t('needSolanaWallet')
      });
      return false;
    }
    return true;
  };

  const validateBalance = (requiredAmount: number): boolean => {
    if (balance < requiredAmount) {
      toast.error(t('insufficientBalance'), {
        description: `${t('youPay')} ${formatPrice(requiredAmount)} USDC, ${t('currentBalanceColon')} ${formatPrice(balance)} USDC`
      });
      return false;
    }
    return true;
  };

  return {
    connected,
    publicKey,
    sendTransaction,
    connection,
    walletAddress,
    balance,
    validateWalletConnection,
    validateBalance,
  };
}

/**
 * Show loading toast and return dismiss function
 */
export function showLoadingToast(message: string, description?: string) {
  return toast.loading(message, { description });
}

/**
 * Show success toast for conquest operations
 */
export function showSuccessToast(title: string, content: React.ReactNode, duration = 5000) {
  toast.success(title, {
    description: content,
    duration,
  });
}

/**
 * Show error toast
 */
export function showErrorToast(title: string, description?: string) {
  toast.error(title, { description });
}
