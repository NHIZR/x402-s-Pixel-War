/**
 * Payment Router
 *
 * 根据功能开关决定使用哪种支付方式:
 * - X402 Protocol (enableX402 = true)
 * - Custom SPL Token (enableX402 = false, 默认)
 */

import { FEATURES } from '@/lib/config/features';
import { useX402Payment } from './x402Payment';
import { useX402PaymentV2 } from './x402PaymentV2';

export interface PaymentResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export interface PaymentService {
  pay: (amount: number, recipient?: string) => Promise<PaymentResult>;
  isReady: boolean;
  walletAddress?: string;
  protocol: 'custom' | 'x402-v2';
}

/**
 * 统一的支付服务 Hook
 *
 * 使用这个 Hook 而不是直接使用 useX402Payment
 * 它会根据功能开关自动选择正确的支付实现
 */
export function usePayment(): PaymentService {
  const customPayment = useX402Payment(); // 当前的 SPL 转账实现
  const x402Payment = useX402PaymentV2(); // 新的 X402 协议实现

  if (FEATURES.enableX402) {
    console.log('💳 Using X402 Protocol v2 payment');
    return x402Payment;
  }

  console.log('💳 Using Custom SPL Token payment');
  return {
    ...customPayment,
    protocol: 'custom' as const,
  };
}

/**
 * 获取当前支付方式的描述
 */
export function getPaymentDescription(): string {
  if (FEATURES.enableX402) {
    return 'X402 Protocol v2 (via PayAI Facilitator)';
  }
  return 'Custom SPL Token Transfer';
}

/**
 * 获取当前使用的 USDC Token 信息
 */
export function getPaymentTokenInfo() {
  if (FEATURES.enableX402) {
    return {
      name: 'Circle Official USDC (DevNet)',
      mint: FEATURES.x402Config.usdcMint,
      source: 'https://faucet.circle.com/',
    };
  }

  return {
    name: 'Custom Test USDC',
    mint: process.env.NEXT_PUBLIC_USDC_MINT_ADDRESS,
    source: 'Game Faucet (in-app)',
  };
}
