'use client';

import { useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Eye, Wallet } from 'lucide-react';
import { useUserStore } from '@/lib/stores/userStore';
import { getUSDCBalance, getSOLBalance } from '@/lib/solana/balance';

export function UserInfo() {
  const { publicKey, connected, disconnect } = useWallet();
  const { connection } = useConnection();
  const { walletAddress, balance, setWalletAddress, setBalance, disconnect: disconnectStore } = useUserStore();

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

        // 🎮 开发模式：如果余额为 0，给测试用户 100 USDC 模拟余额
        if (usdcBalance === 0) {
          console.log('⚠️ 余额为 0，使用模拟余额 100 USDC (开发模式)');
          setBalance(100);
        } else {
          setBalance(usdcBalance);
        }
      } catch (error) {
        console.error('获取余额失败:', error);
        // 🎮 获取失败时也使用模拟余额
        console.log('⚠️ 获取余额失败，使用模拟余额 100 USDC (开发模式)');
        setBalance(100);
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

  if (!connected || !walletAddress) {
    // 游客模式
    return (
      <div className="flex items-center gap-3 px-4 py-2 bg-gray-900/80 rounded-lg border border-gray-800 backdrop-blur-sm">
        {/* 匿名用户标识 */}
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-cyan-400/70" />
          <div className="text-sm">
            <div className="font-semibold text-cyan-400">游客模式</div>
            <div className="text-xs text-gray-400">只可浏览</div>
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
          <div className="text-xs text-gray-400">Solana 钱包</div>
        </div>
      </div>

      {/* USDC 余额 */}
      <div className="border-l border-gray-700 pl-3">
        <div className="text-xs text-gray-500">USDC 余额</div>
        <div className="text-sm font-mono font-medium text-cyan-400">{balance.toFixed(2)} USDC</div>
      </div>

      {/* 断开连接 */}
      <button
        onClick={() => disconnect()}
        className="ml-2 px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-colors"
      >
        断开
      </button>
    </div>
  );
}
