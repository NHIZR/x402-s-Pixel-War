'use client';

import { useEffect, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Eye, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { useUserStore } from '@/lib/stores/userStore';
import { useTransactionStore } from '@/lib/stores/transactionStore';
import { getUSDCBalance, getSOLBalance } from '@/lib/solana/balance';
import { getSolanaExplorerUrl } from '@/lib/config/solana';
import { useLanguage } from '@/lib/i18n';

export function UserInfo() {
  const { publicKey, connected, disconnect } = useWallet();
  const { connection } = useConnection();
  const { walletAddress, balance, setWalletAddress, setBalance, disconnect: disconnectStore } = useUserStore();
  const { addTransaction } = useTransactionStore();
  const { t } = useLanguage();
  const [claiming, setClaiming] = useState(false);

  // 同步钱包状态
  useEffect(() => {
    console.log('钱包连接状态:', { connected, publicKey: publicKey?.toBase58() });
    if (connected && publicKey) {
      const address = publicKey.toBase58();
      console.log('设置钱包地址:', address);
      setWalletAddress(address);
    } else {
      console.log('断开钱包连接');
      disconnectStore();
    }
  }, [connected, publicKey, setWalletAddress, disconnectStore]);

  // 获取 USDC 余额
  useEffect(() => {
    if (!walletAddress || !connection) return;

    const fetchBalance = async () => {
      try {
        const usdcBalance = await getUSDCBalance(connection, walletAddress);
        console.log('💰 获取到的 USDC 余额:', usdcBalance);
        setBalance(usdcBalance);
      } catch (error) {
        console.error('获取余额失败:', error);
        // 获取失败时设为 0
        setBalance(0);
      }
    };

    fetchBalance();

    // 每30秒更新一次余额
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, [walletAddress, connection, setBalance]);

  // 格式化钱包地址
  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // 领取 USDC 测试代币
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
          toast.error(t('claimFailed'), {
            description: data.error || t('tryAgainLater'),
          });
        } else {
          toast.error(t('claimFailed'), {
            description: data.error || t('errorOccurred'),
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

      toast.success(t('claimSuccess'), {
        description: (
          <div>
            <p>{t('sentToWallet', { n: data.amount })}</p>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 underline text-sm mt-1 inline-block"
            >
              {t('viewOnExplorer')}
            </a>
          </div>
        ),
        duration: 10000,
      });

      // Refresh balance after 2 seconds to allow blockchain confirmation
      setTimeout(async () => {
        if (walletAddress && connection) {
          const usdcBalance = await getUSDCBalance(connection, walletAddress);
          setBalance(usdcBalance);
        }
      }, 2000);
    } catch (error) {
      console.error('Faucet claim error:', error);
      toast.error(t('requestFailed'), {
        description: t('networkError'),
      });
    } finally {
      setClaiming(false);
    }
  };

  // 领取 SOL - 跳转到官方 faucet
  const handleClaimSOL = () => {
    if (!publicKey) return;

    // Solana Devnet Faucet URL
    const faucetUrl = `https://faucet.solana.com/?address=${publicKey.toBase58()}`;
    window.open(faucetUrl, '_blank');

    toast.info(t('openingSolanaFaucet'), {
      description: t('completeSolClaimInNewWindow'),
      duration: 5000,
    });
  };

  if (!connected || !walletAddress) {
    // 游客模式
    return (
      <div className="flex items-center gap-3 px-4 py-2 bg-gray-900/80 rounded-lg border border-gray-800 backdrop-blur-sm">
        {/* 匿名用户标识 */}
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-cyan-400/70" />
          <div className="text-sm">
            <div className="font-semibold text-cyan-400">{t('guestMode')}</div>
            <div className="text-xs text-gray-400">{t('viewOnly')}</div>
          </div>
        </div>

        {/* 连接钱包按钮 */}
        <div className="border-l border-gray-700 pl-3">
          <WalletMultiButton className="!bg-cyan-600 hover:!bg-cyan-500 !h-8 !px-3 !text-sm !rounded" />
        </div>
      </div>
    );
  }

  // 已登录状态
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gray-900/80 rounded-lg border border-gray-800 backdrop-blur-sm">
      {/* 钱包地址 */}
      <div className="flex items-center gap-2">
        <Wallet className="w-4 h-4 text-cyan-400" />
        <div className="text-sm">
          <div className="font-semibold text-cyan-400 font-mono">{formatAddress(walletAddress)}</div>
          <div className="text-xs text-gray-400">{t('solanaWallet')}</div>
        </div>
      </div>

      {/* USDC 余额 */}
      <div className="border-l border-gray-700 pl-3">
        <div className="text-xs text-gray-500">{t('usdcBalance')}</div>
        <div className="text-sm font-mono font-medium text-cyan-400">{balance.toFixed(2)} USDC</div>
      </div>

      {/* 领取按钮组 */}
      <div className="flex items-center gap-2">
        {/* 领取 USDC */}
        <button
          onClick={handleClaimTokens}
          disabled={claiming}
          className="px-3 py-1 text-xs bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
          title={t('claimUSDC')}
        >
          {claiming ? (
            <>
              <span className="inline-block animate-spin mr-1">⏳</span>
              {t('claiming')}
            </>
          ) : (
            <>💧 {t('claimUSDC')}</>
          )}
        </button>

        {/* 领取 SOL */}
        <button
          onClick={handleClaimSOL}
          className="px-3 py-1 text-xs bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors"
          title={t('claimSOL')}
        >
          ⚡ {t('claimSOL')}
        </button>
      </div>

      {/* 断开连接 */}
      <button
        onClick={() => disconnect()}
        className="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
      >
        {t('disconnect')}
      </button>
    </div>
  );
}
