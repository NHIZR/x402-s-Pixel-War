/**
 * WalletConnectionGuide Component
 * Shows one-time guidance when user connects wallet with low balance
 */

'use client';

import { useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'sonner';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { useLanguage } from '@/lib/i18n';

const LOW_BALANCE_THRESHOLD = 10; // USDC
const GUIDANCE_SHOWN_KEY = 'faucet-guidance-shown';

export function WalletConnectionGuide() {
  const { connected } = useWallet();
  const { balance, loading } = useTokenBalance();
  const { t } = useLanguage();
  const hasShownGuideRef = useRef(false);
  const previousConnectedRef = useRef(false);

  useEffect(() => {
    // Check if this is a new connection (was disconnected, now connected)
    const isNewConnection = connected && !previousConnectedRef.current;

    // Update previous connected state
    previousConnectedRef.current = connected;

    // Don't show if not a new connection
    if (!isNewConnection) {
      return;
    }

    // Don't show if still loading balance
    if (loading) {
      return;
    }

    // Don't show if already shown this session
    if (hasShownGuideRef.current) {
      return;
    }

    // Check if guidance was already shown (persisted in localStorage)
    try {
      const hasShownBefore = localStorage.getItem(GUIDANCE_SHOWN_KEY);
      if (hasShownBefore) {
        return;
      }
    } catch (error) {
      // localStorage might not be available, continue anyway
      console.warn('localStorage not available:', error);
    }

    // Show guidance if balance is low
    if (balance < LOW_BALANCE_THRESHOLD) {
      toast.info(t('needTestUSDC'), {
        description: (
          <div>
            <p>{t('balanceLow', { n: balance.toFixed(2) })}</p>
            <p className="mt-1">
              {t('clickFaucetButton')}{' '}
              <span className="inline-flex items-center px-2 py-0.5 bg-cyan-600 text-white rounded text-xs font-medium">
                💧 {t('faucetButtonLabel')}
              </span>{' '}
              {t('toGetFreeTokens')}
            </p>
            <p className="mt-2 text-xs text-gray-400">
              💡 {t('solWarningTip')}
            </p>
          </div>
        ),
        duration: 10000,
      });

      // Mark as shown
      hasShownGuideRef.current = true;

      // Persist to localStorage
      try {
        localStorage.setItem(GUIDANCE_SHOWN_KEY, 'true');
      } catch (error) {
        // Ignore localStorage errors
        console.warn('Failed to save guidance state:', error);
      }
    }
  }, [connected, balance, loading, t]);

  // This component doesn't render anything
  return null;
}
