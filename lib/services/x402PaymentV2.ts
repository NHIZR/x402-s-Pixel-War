/**
 * X402 Payment Service (Protocol v2)
 *
 * 使用真正的 x402 协议进行支付
 * 这个文件只在 FEATURES.enableX402 = true 时使用
 */

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { createX402Client } from 'x402-solana/client';
import { FEATURES } from '@/lib/config/features';
import { SOLANA_CONFIG } from '@/lib/config/solana';

export interface X402PaymentResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

/**
 * Hook for X402 protocol payments
 *
 * 这是新的 X402 实现,通过 PayAI Facilitator 处理支付
 */
export function useX402PaymentV2() {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();

  /**
   * 使用 X402 协议进行支付
   *
   * @param amount - Amount in USDC
   * @param recipient - Optional recipient (defaults to treasury)
   * @returns X402PaymentResult
   */
  const pay = async (
    amount: number,
    recipient?: string
  ): Promise<X402PaymentResult> => {
    try {
      // Validate wallet connection
      if (!publicKey || !signTransaction) {
        return {
          success: false,
          error: '请先连接钱包',
        };
      }

      // Validate amount
      if (amount <= 0) {
        return {
          success: false,
          error: '支付金额必须大于 0',
        };
      }

      console.log('🚀 Using X402 Protocol v2 for payment:', {
        amount,
        recipient: recipient || SOLANA_CONFIG.treasuryWallet,
        facilitator: FEATURES.x402Config.facilitatorUrl,
      });

      // Create X402 client
      const x402Client = createX402Client({
        wallet: {
          address: publicKey.toString(),
          signTransaction: async (tx) => {
            return await signTransaction(tx);
          },
        },
        network: 'solana-devnet', // 自动转换为 CAIP-2 格式
        rpcUrl: SOLANA_CONFIG.rpcUrl,
        amount: BigInt(Math.floor(amount * 1_000_000)), // Safety limit
        verbose: true, // 开启调试日志
      });

      // 调用你的后端 API (它会返回 402 Payment Required)
      // X402 客户端会自动处理支付流程
      const response = await x402Client.fetch('/api/x402/conquer-pixel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          recipient: recipient || SOLANA_CONFIG.treasuryWallet,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error || 'X402 支付失败',
        };
      }

      const data = await response.json();

      console.log('✅ X402 Payment successful:', data);

      return {
        success: true,
        txHash: data.txHash,
      };
    } catch (error: any) {
      console.error('❌ X402 Payment error:', error);

      let errorMessage = '支付失败，请重试';

      if (error?.message) {
        const msg = error.message.toLowerCase();

        if (msg.includes('user rejected') || msg.includes('rejected')) {
          errorMessage = '用户取消了交易';
        } else if (msg.includes('insufficient') || msg.includes('not enough')) {
          errorMessage = 'USDC 余额不足';
        } else if (msg.includes('facilitator')) {
          errorMessage = 'X402 Facilitator 服务异常';
        } else {
          errorMessage = `支付失败: ${error.message}`;
        }
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  return {
    pay,
    isReady: !!publicKey && !!connection,
    walletAddress: publicKey?.toBase58(),
    protocol: 'x402-v2' as const,
  };
}

/**
 * 提示: X402 需要后端配合
 *
 * 你需要创建一个后端 API route:
 * /api/x402/conquer-pixel
 *
 * 它应该:
 * 1. 返回 402 Payment Required (如果没有支付)
 * 2. 验证支付签名 (通过 PayAI Facilitator)
 * 3. 返回 200 OK (支付成功后)
 *
 * 参考: node_modules/x402-solana/README.md 的 Server Side 部分
 */
