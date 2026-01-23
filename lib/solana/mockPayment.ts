/**
 * Mock x402 Payment System
 *
 * This is a temporary mock implementation for rapid hackathon development.
 * In production, this should be replaced with actual x402/PayAI integration.
 */

import { Connection, PublicKey } from '@solana/web3.js';

export interface PaymentResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

/**
 * Mock payment function that simulates x402 USDC payment
 *
 * @param connection - Solana connection
 * @param walletAddress - User's wallet address
 * @param amount - Amount in USDC (with decimals)
 * @returns Promise<PaymentResult>
 */
export async function mockX402Payment(
  connection: Connection,
  walletAddress: string,
  amount: number
): Promise<PaymentResult> {
  try {
    // Simulate network delay (500-1500ms)
    const delay = 500 + Math.random() * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));

    // Validate inputs
    if (!walletAddress) {
      return { success: false, error: '钱包地址无效' };
    }

    if (amount <= 0) {
      return { success: false, error: '支付金额必须大于 0' };
    }

    // Simulate 5% random failure rate for realistic testing
    if (Math.random() < 0.05) {
      return {
        success: false,
        error: '网络错误，请重试'
      };
    }

    // Generate a fake transaction hash
    const fakeTxHash = generateFakeTxHash();

    console.log('Mock Payment Success:', {
      wallet: walletAddress,
      amount: `${amount} USDC`,
      txHash: fakeTxHash,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      txHash: fakeTxHash
    };

  } catch (error) {
    console.error('Mock payment error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

/**
 * Generate a realistic-looking fake Solana transaction hash
 */
function generateFakeTxHash(): string {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let hash = '';
  for (let i = 0; i < 88; i++) {
    hash += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return hash;
}

/**
 * Batch payment for multiple pixels
 *
 * @param connection - Solana connection
 * @param walletAddress - User's wallet address
 * @param totalAmount - Total amount in USDC
 * @param pixelCount - Number of pixels being purchased
 * @returns Promise<PaymentResult>
 */
export async function mockBatchPayment(
  connection: Connection,
  walletAddress: string,
  totalAmount: number,
  pixelCount: number
): Promise<PaymentResult> {
  try {
    // Batch payments take longer
    const delay = 1000 + Math.random() * 2000;
    await new Promise(resolve => setTimeout(resolve, delay));

    if (!walletAddress) {
      return { success: false, error: '钱包地址无效' };
    }

    if (totalAmount <= 0 || pixelCount <= 0) {
      return { success: false, error: '支付参数无效' };
    }

    // Simulate 3% failure rate for batch operations
    if (Math.random() < 0.03) {
      return {
        success: false,
        error: '批量支付失败，请重试'
      };
    }

    const fakeTxHash = generateFakeTxHash();

    console.log('Mock Batch Payment Success:', {
      wallet: walletAddress,
      totalAmount: `${totalAmount} USDC`,
      pixelCount,
      txHash: fakeTxHash,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      txHash: fakeTxHash
    };

  } catch (error) {
    console.error('Mock batch payment error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

/**
 * Check if user has sufficient balance for payment
 * This is a client-side check only - real payment will verify on-chain
 */
export function checkSufficientBalance(userBalance: number, requiredAmount: number): boolean {
  return userBalance >= requiredAmount;
}
