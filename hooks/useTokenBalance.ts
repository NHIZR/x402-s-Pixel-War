/**
 * useTokenBalance Hook
 * Monitors USDC balance for connected wallet with auto-refresh
 */

import { useEffect, useState, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { SOLANA_CONFIG } from '@/lib/config/solana';

const REFRESH_INTERVAL = 10000; // 10 seconds

interface TokenBalanceResult {
  balance: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTokenBalance(): TokenBalanceResult {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    // Reset if wallet disconnected
    if (!connected || !publicKey) {
      setBalance(0);
      setError(null);
      return;
    }

    // Validate USDC mint configuration
    if (!SOLANA_CONFIG.usdcMint) {
      setError('USDC mint address not configured');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const mintPublicKey = new PublicKey(SOLANA_CONFIG.usdcMint);

      // Get associated token account address
      const tokenAccountAddress = await getAssociatedTokenAddress(
        mintPublicKey,
        publicKey
      );

      // Try to fetch account info
      const accountInfo = await getAccount(connection, tokenAccountAddress);

      // Calculate balance (USDC has 6 decimals)
      const balanceAmount = Number(accountInfo.amount) / 1_000_000;
      setBalance(balanceAmount);
    } catch (err: any) {
      // If token account doesn't exist, balance is 0 (not an error)
      if (err.message?.includes('could not find account') ||
          err.name === 'TokenAccountNotFoundError') {
        setBalance(0);
        setError(null);
      } else {
        console.error('Error fetching token balance:', err);
        setError(err.message || 'Failed to fetch balance');
        setBalance(0);
      }
    } finally {
      setLoading(false);
    }
  }, [connection, publicKey, connected]);

  // Initial fetch when wallet connects
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!connected || !publicKey) {
      return;
    }

    const intervalId = setInterval(() => {
      fetchBalance();
    }, REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [connected, publicKey, fetchBalance]);

  return {
    balance,
    loading,
    error,
    refetch: fetchBalance,
  };
}
