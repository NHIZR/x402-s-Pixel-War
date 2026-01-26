'use client';

import { useEffect, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Wallet, Coins, Activity, ExternalLink, Clock } from 'lucide-react';
import { useUserStore } from '@/lib/stores/userStore';
import { useTransactionStore, Transaction } from '@/lib/stores/transactionStore';
import { getSOLBalance, getUSDCBalance } from '@/lib/solana/balance';
import { getSolanaExplorerUrl } from '@/lib/config/solana';
import { useLanguage } from '@/lib/i18n';

export function TransactionPanel() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const { walletAddress, balance: usdcBalance, setBalance } = useUserStore();
  const { transactions } = useTransactionStore();
  const { t } = useLanguage();
  const [solBalance, setSolBalance] = useState<number>(0);

  // 获取 SOL 余额
  useEffect(() => {
    if (!walletAddress || !connection) {
      setSolBalance(0);
      return;
    }

    const fetchSOLBalance = async () => {
      const sol = await getSOLBalance(connection, walletAddress);
      setSolBalance(sol);
    };

    fetchSOLBalance();

    // 每 30 秒更新一次
    const interval = setInterval(fetchSOLBalance, 30000);
    return () => clearInterval(interval);
  }, [walletAddress, connection]);

  // 格式化时间
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  // 格式化钱包地址
  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // 获取交易图标
  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'conquer':
        return '🎯';
      case 'batch_conquer':
        return '🎨';
      case 'faucet':
        return '💧';
      default:
        return '📝';
    }
  };

  // 获取交易描述
  const getTransactionDescription = (tx: Transaction) => {
    switch (tx.type) {
      case 'conquer':
        return `${t('pixelAt')} (${tx.pixelX}, ${tx.pixelY})`;
      case 'batch_conquer':
        return `${tx.pixelCount} ${t('pixels')}`;
      case 'faucet':
        return t('claimedUSDC');
      default:
        return 'Transaction';
    }
  };

  // 获取状态样式
  const getStatusStyle = (status: Transaction['status']) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400 animate-pulse';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  if (!connected) {
    return (
      <div className="w-80 bg-gray-900/95 border-l border-gray-800 p-4 flex flex-col h-full backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-800">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white">{t('dashboard')}</h2>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">{t('connectWalletToView')}</p>
            <p className="text-xs mt-1">{t('balanceAndTransactions')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-gray-900/95 border-l border-gray-800 flex flex-col h-full backdrop-blur-sm">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white">{t('dashboard')}</h2>
        </div>

        {/* Wallet Address */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <Wallet className="w-4 h-4" />
          <span className="font-mono">{formatAddress(walletAddress || '')}</span>
          <a
            href={getSolanaExplorerUrl('address', walletAddress || '')}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-cyan-400 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* SOL Balance */}
          <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-lg p-3 border border-purple-700/30">
            <div className="flex items-center gap-1.5 text-xs text-purple-300 mb-1">
              <span className="text-base">◎</span>
              <span>SOL</span>
            </div>
            <div className="text-lg font-bold text-white font-mono">
              {solBalance.toFixed(4)}
            </div>
          </div>

          {/* USDC Balance */}
          <div className="bg-gradient-to-br from-cyan-900/50 to-cyan-800/30 rounded-lg p-3 border border-cyan-700/30">
            <div className="flex items-center gap-1.5 text-xs text-cyan-300 mb-1">
              <Coins className="w-3.5 h-3.5" />
              <span>USDC</span>
            </div>
            <div className="text-lg font-bold text-white font-mono">
              {usdcBalance.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">{t('recentTransactions')}</span>
          <span className="text-xs text-gray-500">{transactions.length} {t('txs')}</span>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
              <Clock className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">{t('noTransactionsYet')}</p>
              <p className="text-xs mt-1">{t('conquerPixelsToSeeActivity')}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800/50">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="px-4 py-3 hover:bg-gray-800/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getTransactionIcon(tx.type)}</span>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {getTransactionDescription(tx)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatTime(tx.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono text-cyan-400">
                        {tx.type === 'faucet' ? '+' : '-'}{tx.amount.toFixed(2)}
                      </p>
                      <p className={`text-xs ${getStatusStyle(tx.status)}`}>
                        {tx.status === 'confirmed' ? t('confirmed') : tx.status === 'pending' ? t('pending') : t('failed')}
                      </p>
                    </div>
                  </div>

                  {/* Transaction Hash */}
                  {tx.txHash && (
                    <a
                      href={getSolanaExplorerUrl('tx', tx.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 flex items-center gap-1 text-xs text-gray-500 hover:text-cyan-400 transition-colors"
                    >
                      <span className="font-mono truncate">
                        {tx.txHash.slice(0, 8)}...{tx.txHash.slice(-8)}
                      </span>
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="p-3 border-t border-gray-800 bg-gray-900/50">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <p className="text-gray-500">{t('conquests')}</p>
            <p className="text-white font-mono">
              {transactions.filter(tx => tx.type === 'conquer' || tx.type === 'batch_conquer').length}
            </p>
          </div>
          <div>
            <p className="text-gray-500">{t('spent')}</p>
            <p className="text-cyan-400 font-mono">
              {transactions
                .filter(tx => tx.type !== 'faucet' && tx.status === 'confirmed')
                .reduce((sum, tx) => sum + tx.amount, 0)
                .toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-gray-500">{t('network')}</p>
            <p className="text-green-400">Devnet</p>
          </div>
        </div>
      </div>
    </div>
  );
}
