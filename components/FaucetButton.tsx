/**
 * FaucetButton Component
 * Displays USDC balance and allows users to request test tokens
 */

'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'sonner';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { getSolanaExplorerUrl } from '@/lib/config/solana';
import { useTransactionStore } from '@/lib/stores/transactionStore';
import { Button } from './ui/button';

export function FaucetButton() {
  const { publicKey, connected } = useWallet();
  const { balance, loading: balanceLoading, refetch } = useTokenBalance();
  const { addTransaction } = useTransactionStore();
  const [claiming, setClaiming] = useState(false);

  // Only show when wallet is connected
  if (!connected || !publicKey) {
    return null;
  }

  const handleClaimTokens = async () => {
    if (!publicKey) return;

    setClaiming(true);

    try {
      const response = await fetch('/api/faucet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle different error cases
        if (response.status === 429) {
          toast.error('领取失败', {
            description: data.error || '请稍后再试',
          });
        } else {
          toast.error('领取失败', {
            description: data.error || '未知错误',
          });
        }
        return;
      }

      // Success - show transaction link
      const explorerUrl = getSolanaExplorerUrl('tx', data.txHash);

      // 添加交易记录
      addTransaction({
        type: 'faucet',
        amount: data.amount || 100,
        txHash: data.txHash,
        status: 'confirmed',
      });

      toast.success('领取成功！', {
        description: (
          <div>
            <p>已发送 {data.amount} USDC 到您的钱包</p>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 underline text-sm mt-1 inline-block"
            >
              在 Solana Explorer 查看交易 →
            </a>
          </div>
        ),
        duration: 10000,
      });

      // Refresh balance after 2 seconds to allow blockchain confirmation
      setTimeout(() => {
        refetch();
      }, 2000);
    } catch (error) {
      console.error('Faucet claim error:', error);
      toast.error('请求失败', {
        description: '网络错误，请稍后重试',
      });
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg">
      {/* Balance display */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">余额:</span>
        <span className="font-mono font-semibold text-cyan-400">
          {balanceLoading ? (
            <span className="text-gray-500">...</span>
          ) : (
            `${balance.toFixed(2)} USDC`
          )}
        </span>
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-gray-700"></div>

      {/* Faucet button */}
      <Button
        onClick={handleClaimTokens}
        disabled={claiming || balanceLoading}
        size="sm"
        className="bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {claiming ? (
          <>
            <span className="inline-block animate-spin mr-2">⏳</span>
            领取中...
          </>
        ) : (
          <>💧 领取</>
        )}
      </Button>
    </div>
  );
}
