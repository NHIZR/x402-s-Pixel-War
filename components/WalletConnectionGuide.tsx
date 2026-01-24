/**
 * WalletConnectionGuide Component
 * Shows one-time guidance when user connects wallet with low balance
 */

'use client';

import { useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'sonner';
import { useTokenBalance } from '@/hooks/useTokenBalance';

const LOW_BALANCE_THRESHOLD = 10; // USDC
const GUIDANCE_SHOWN_KEY = 'faucet-guidance-shown';

export function WalletConnectionGuide() {
  const { connected } = useWallet();
  const { balance, loading } = useTokenBalance();
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
      toast.info('需要测试 USDC？', {
        description: (
          <div>
            <p>您的余额较低 ({balance.toFixed(2)} USDC)。</p>
            <p className="mt-1">
              点击右上角的{' '}
              <span className="inline-flex items-center px-2 py-0.5 bg-cyan-600 text-white rounded text-xs font-medium">
                💧 领取
              </span>{' '}
              按钮获取免费测试代币！
            </p>
          </div>
        ),
        duration: 8000,
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
  }, [connected, balance, loading]);

  // This component doesn't render anything
  return null;
}
