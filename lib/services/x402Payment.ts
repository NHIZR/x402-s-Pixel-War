/**
 * x402 Payment Service
 *
 * Real USDC SPL token payment implementation for Solana Testnet.
 * Replaces the mock payment system with actual on-chain transfers.
 */

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { SOLANA_CONFIG } from '@/lib/config/solana';

export interface PaymentResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

/**
 * Parse payment error and return user-friendly message
 */
function parsePaymentError(error: any): string {
  if (!error?.message) {
    return '支付失败，请重试';
  }

  const msg = error.message.toLowerCase();

  if (msg.includes('user rejected') || msg.includes('rejected') || msg.includes('cancelled')) {
    return '用户取消了交易';
  }
  if (msg.includes('insufficient funds for rent') || msg.includes('insufficient lamports') || (msg.includes('insufficient') && msg.includes('sol'))) {
    return 'SOL 余额不足，无法支付交易费。请先点击紫色 ⚡ 按钮领取测试 SOL';
  }
  if (msg.includes('insufficient') || msg.includes('not enough')) {
    return 'USDC 余额不足';
  }
  if (msg.includes('token account') || msg.includes('account not found')) {
    return '未找到 USDC 账户，请先获取一些 USDC';
  }
  if (msg.includes('timeout') || msg.includes('network')) {
    return '网络错误，请重试';
  }
  if (msg.includes('blockhash') || msg.includes('expired')) {
    return '交易超时，请重试';
  }

  return `支付失败: ${error.message}`;
}

/**
 * Hook for x402 payments using real SPL token transfers
 */
export function useX402Payment() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  /**
   * Process a payment using SPL token transfer
   *
   * @param amount - Amount in USDC (with decimals, e.g., 1.5 for 1.5 USDC)
   * @param recipient - Optional recipient address (defaults to treasury wallet)
   * @returns PaymentResult with transaction hash or error
   */
  const pay = async (
    amount: number,
    recipient?: string
  ): Promise<PaymentResult> => {
    try {
      // Validate wallet connection
      if (!publicKey) {
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

      // Validate configuration
      if (!SOLANA_CONFIG.usdcMint) {
        return {
          success: false,
          error: 'USDC mint 地址未配置',
        };
      }

      // Determine recipient (default to treasury wallet)
      const recipientAddress = recipient || SOLANA_CONFIG.treasuryWallet;
      if (!recipientAddress) {
        return {
          success: false,
          error: '收款地址未配置',
        };
      }

      // Convert amount to smallest units (USDC has 6 decimals)
      const amountInSmallestUnits = Math.floor(amount * 1_000_000);

      // Get USDC mint public key
      const usdcMint = new PublicKey(SOLANA_CONFIG.usdcMint);

      // Get sender's token account
      const senderTokenAccount = await getAssociatedTokenAddress(
        usdcMint,
        publicKey
      );

      // Get recipient's token account
      const recipientPubkey = new PublicKey(recipientAddress);
      const recipientTokenAccount = await getAssociatedTokenAddress(
        usdcMint,
        recipientPubkey
      );

      // Create transfer instruction
      const transferInstruction = createTransferInstruction(
        senderTokenAccount,
        recipientTokenAccount,
        publicKey,
        amountInSmallestUnits,
        [],
        TOKEN_PROGRAM_ID
      );

      // Create transaction
      const transaction = new Transaction().add(transferInstruction);

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      console.log('Sending payment transaction:', {
        sender: publicKey.toBase58(),
        recipient: recipientAddress,
        amount: `${amount} USDC`,
        amountInSmallestUnits,
        timestamp: new Date().toISOString(),
      });

      // Send transaction
      // Skip preflight to avoid Phantom's false "insufficient SOL" warning
    const txHash = await sendTransaction(transaction, connection, {
      skipPreflight: true,
      preflightCommitment: 'processed',
    });

      console.log('Transaction sent:', txHash);

      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(
        {
          signature: txHash,
          blockhash,
          lastValidBlockHeight,
        },
        'confirmed'
      );

      if (confirmation.value.err) {
        console.error('Transaction failed:', confirmation.value.err);
        return {
          success: false,
          error: '交易失败，请重试',
        };
      }

      console.log('Payment confirmed:', {
        txHash,
        amount: `${amount} USDC`,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        txHash,
      };

    } catch (error: any) {
      console.error('Payment error:', error);
      return {
        success: false,
        error: parsePaymentError(error),
      };
    }
  };

  return {
    pay,
    isReady: !!publicKey && !!connection,
    walletAddress: publicKey?.toBase58(),
  };
}

/**
 * Standalone payment function for use outside React components
 *
 * @param connection - Solana connection
 * @param walletPublicKey - User's wallet public key
 * @param sendTransaction - Wallet adapter's sendTransaction function
 * @param amount - Amount in USDC
 * @param recipient - Optional recipient address
 * @returns PaymentResult
 */
export async function processPayment(
  connection: any,
  walletPublicKey: PublicKey,
  sendTransaction: any,
  amount: number,
  recipient?: string
): Promise<PaymentResult> {
  try {
    // Validate amount
    if (amount <= 0) {
      return {
        success: false,
        error: '支付金额必须大于 0',
      };
    }

    // Validate configuration
    if (!SOLANA_CONFIG.usdcMint) {
      return {
        success: false,
        error: 'USDC mint 地址未配置',
      };
    }

    // Determine recipient
    const recipientAddress = recipient || SOLANA_CONFIG.treasuryWallet;
    if (!recipientAddress) {
      return {
        success: false,
        error: '收款地址未配置',
      };
    }

    // Convert amount to smallest units
    const amountInSmallestUnits = Math.floor(amount * 1_000_000);

    // Get USDC mint
    const usdcMint = new PublicKey(SOLANA_CONFIG.usdcMint);

    // Get token accounts
    const senderTokenAccount = await getAssociatedTokenAddress(
      usdcMint,
      walletPublicKey
    );

    const recipientPubkey = new PublicKey(recipientAddress);
    const recipientTokenAccount = await getAssociatedTokenAddress(
      usdcMint,
      recipientPubkey
    );

    // Create transfer instruction
    const transferInstruction = createTransferInstruction(
      senderTokenAccount,
      recipientTokenAccount,
      walletPublicKey,
      amountInSmallestUnits,
      [],
      TOKEN_PROGRAM_ID
    );

    // Create and send transaction
    const transaction = new Transaction().add(transferInstruction);
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = walletPublicKey;

    // Skip preflight to avoid Phantom's false "insufficient SOL" warning
    const txHash = await sendTransaction(transaction, connection, {
      skipPreflight: true,
      preflightCommitment: 'processed',
    });

    // Wait for confirmation
    const confirmation = await connection.confirmTransaction(
      {
        signature: txHash,
        blockhash,
        lastValidBlockHeight,
      },
      'confirmed'
    );

    if (confirmation.value.err) {
      return {
        success: false,
        error: '交易失败，请重试',
      };
    }

    return {
      success: true,
      txHash,
    };

  } catch (error: any) {
    console.error('Payment error:', error);
    return {
      success: false,
      error: parsePaymentError(error),
    };
  }
}
