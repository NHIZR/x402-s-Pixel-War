/**
 * Faucet Service
 * Distributes test USDC tokens to users on Solana Testnet
 */

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
} from '@solana/spl-token';
import bs58 from 'bs58';
import { SOLANA_CONFIG } from '@/lib/config/solana';

// Faucet configuration
const FAUCET_AMOUNT = 100; // 100 USDC
const USDC_DECIMALS = 6;
const FAUCET_AMOUNT_SMALLEST_UNIT = FAUCET_AMOUNT * Math.pow(10, USDC_DECIMALS); // 100_000_000

interface FaucetResult {
  success: boolean;
  txHash?: string;
  amount?: number;
  error?: string;
}

/**
 * Distribute test USDC tokens to a user wallet
 *
 * @param recipientAddress - The wallet address to receive tokens
 * @returns Result object with transaction details or error
 */
export async function distributeFaucetTokens(
  recipientAddress: string
): Promise<FaucetResult> {
  try {
    // Validate environment variables
    const faucetPrivateKey = process.env.FAUCET_WALLET_PRIVATE_KEY;
    const usdcMintAddress = SOLANA_CONFIG.usdcMint;

    if (!faucetPrivateKey) {
      throw new Error('FAUCET_WALLET_PRIVATE_KEY not configured');
    }

    if (!usdcMintAddress) {
      throw new Error('USDC mint address not configured');
    }

    // Initialize connection
    const connection = new Connection(SOLANA_CONFIG.rpcUrl, 'confirmed');

    // Decode faucet wallet private key
    const faucetKeypair = Keypair.fromSecretKey(bs58.decode(faucetPrivateKey));

    // Parse recipient and mint addresses
    const recipientPublicKey = new PublicKey(recipientAddress);
    const usdcMintPublicKey = new PublicKey(usdcMintAddress);

    // Get token accounts
    const faucetTokenAccount = await getAssociatedTokenAddress(
      usdcMintPublicKey,
      faucetKeypair.publicKey
    );

    const recipientTokenAccount = await getAssociatedTokenAddress(
      usdcMintPublicKey,
      recipientPublicKey
    );

    // Verify faucet has tokens
    try {
      const faucetAccount = await getAccount(connection, faucetTokenAccount);
      if (faucetAccount.amount < BigInt(FAUCET_AMOUNT_SMALLEST_UNIT)) {
        return {
          success: false,
          error: 'Faucet has insufficient funds',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Faucet token account not found or not initialized',
      };
    }

    // Create transaction
    const transaction = new Transaction();

    // Check if recipient token account exists
    let recipientAccountExists = false;
    try {
      await getAccount(connection, recipientTokenAccount);
      recipientAccountExists = true;
    } catch (error) {
      // Account doesn't exist, need to create it
      recipientAccountExists = false;
    }

    // Add instruction to create recipient token account if it doesn't exist
    // 注意：Faucet 钱包支付创建账户的租金（约 0.00203928 SOL）
    // 用户钱包只需支付交易手续费（约 0.00001 SOL）
    // Phantom 钱包可能会显示 "insufficient SOL" 警告，但这是误报：
    // - Phantom 的预检查可能误判用户需要支付账户创建成本
    // - 实际上 Faucet（payer）会支付这部分费用
    // - 用户可以安全地点击 "Confirm anyway"，交易会成功
    if (!recipientAccountExists) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          faucetKeypair.publicKey, // payer (Faucet 支付账户创建租金)
          recipientTokenAccount, // associated token account
          recipientPublicKey, // owner (用户拥有账户)
          usdcMintPublicKey // mint
        )
      );
    }

    // Add transfer instruction
    transaction.add(
      createTransferInstruction(
        faucetTokenAccount, // source
        recipientTokenAccount, // destination
        faucetKeypair.publicKey, // owner
        FAUCET_AMOUNT_SMALLEST_UNIT // amount
      )
    );

    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = faucetKeypair.publicKey;

    // Sign transaction
    transaction.sign(faucetKeypair);

    // Send transaction with skipPreflight for faster response
    const signature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'processed',
    });

    // Return immediately after sending - don't wait for full confirmation
    // This prevents Vercel serverless timeout issues
    // The transaction will be confirmed on-chain regardless
    return {
      success: true,
      txHash: signature,
      amount: FAUCET_AMOUNT,
    };
  } catch (error) {
    console.error('Faucet distribution error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get faucet wallet balance (for monitoring)
 */
export async function getFaucetBalance(): Promise<number> {
  try {
    const faucetPrivateKey = process.env.FAUCET_WALLET_PRIVATE_KEY;
    const usdcMintAddress = SOLANA_CONFIG.usdcMint;

    if (!faucetPrivateKey || !usdcMintAddress) {
      throw new Error('Faucet not configured');
    }

    const connection = new Connection(SOLANA_CONFIG.rpcUrl, 'confirmed');
    const faucetKeypair = Keypair.fromSecretKey(bs58.decode(faucetPrivateKey));
    const usdcMintPublicKey = new PublicKey(usdcMintAddress);

    const faucetTokenAccount = await getAssociatedTokenAddress(
      usdcMintPublicKey,
      faucetKeypair.publicKey
    );

    const account = await getAccount(connection, faucetTokenAccount);
    return Number(account.amount) / Math.pow(10, USDC_DECIMALS);
  } catch (error) {
    console.error('Error getting faucet balance:', error);
    return 0;
  }
}
