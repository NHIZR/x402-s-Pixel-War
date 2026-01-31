/**
 * Server-side Payment Service
 *
 * Handles USDC SPL token transfers on behalf of AI agents
 * Uses the agent's private key to sign transactions
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
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import bs58 from 'bs58';
import { SOLANA_CONFIG } from '@/lib/config/solana';

const USDC_DECIMALS = 6;

export interface ServerPaymentResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

/**
 * Process a payment from an agent wallet to the treasury
 *
 * @param agentPrivateKey - Base58 encoded private key of the agent wallet
 * @param amount - Amount in USDC (e.g., 1.5 for 1.5 USDC)
 * @returns PaymentResult with transaction hash or error
 */
export async function processServerPayment(
  agentPrivateKey: string,
  amount: number
): Promise<ServerPaymentResult> {
  try {
    // Validate configuration
    const usdcMintAddress = SOLANA_CONFIG.usdcMint;
    const treasuryAddress = SOLANA_CONFIG.treasuryWallet;

    if (!usdcMintAddress) {
      throw new Error('USDC mint address not configured');
    }

    if (!treasuryAddress) {
      throw new Error('Treasury wallet not configured');
    }

    // Validate amount
    if (amount <= 0) {
      return {
        success: false,
        error: 'Payment amount must be greater than 0',
      };
    }

    // Initialize connection
    const connection = new Connection(SOLANA_CONFIG.rpcUrl, 'confirmed');

    // Decode agent wallet private key
    let agentKeypair: Keypair;
    try {
      agentKeypair = Keypair.fromSecretKey(bs58.decode(agentPrivateKey));
    } catch (e) {
      return {
        success: false,
        error: 'Invalid private key format',
      };
    }

    const usdcMintPublicKey = new PublicKey(usdcMintAddress);
    const treasuryPublicKey = new PublicKey(treasuryAddress);

    // Get token accounts
    const agentTokenAccount = await getAssociatedTokenAddress(
      usdcMintPublicKey,
      agentKeypair.publicKey
    );

    const treasuryTokenAccount = await getAssociatedTokenAddress(
      usdcMintPublicKey,
      treasuryPublicKey
    );

    // Verify agent has sufficient tokens
    try {
      const agentAccount = await getAccount(connection, agentTokenAccount);
      const requiredAmount = BigInt(Math.floor(amount * Math.pow(10, USDC_DECIMALS)));
      if (agentAccount.amount < requiredAmount) {
        return {
          success: false,
          error: `Insufficient USDC balance. Required: ${amount}, Available: ${Number(agentAccount.amount) / Math.pow(10, USDC_DECIMALS)}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Agent USDC token account not found. Please request tokens from the faucet first.',
      };
    }

    // Create transaction
    const transaction = new Transaction();

    // Check if treasury token account exists (it should, but just in case)
    try {
      await getAccount(connection, treasuryTokenAccount);
    } catch (error) {
      // Create treasury token account if it doesn't exist
      transaction.add(
        createAssociatedTokenAccountInstruction(
          agentKeypair.publicKey,
          treasuryTokenAccount,
          treasuryPublicKey,
          usdcMintPublicKey
        )
      );
    }

    // Convert amount to smallest units
    const amountInSmallestUnits = Math.floor(amount * Math.pow(10, USDC_DECIMALS));

    // Add transfer instruction
    transaction.add(
      createTransferInstruction(
        agentTokenAccount,
        treasuryTokenAccount,
        agentKeypair.publicKey,
        amountInSmallestUnits,
        [],
        TOKEN_PROGRAM_ID
      )
    );

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = agentKeypair.publicKey;

    // Sign transaction
    transaction.sign(agentKeypair);

    // Send transaction
    const signature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });

    // Wait for confirmation
    await connection.confirmTransaction(signature, 'confirmed');

    console.log('Server payment successful:', {
      from: agentKeypair.publicKey.toBase58(),
      amount: `${amount} USDC`,
      txHash: signature,
    });

    return {
      success: true,
      txHash: signature,
    };

  } catch (error) {
    console.error('Server payment error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get wallet address from private key
 */
export function getWalletAddressFromPrivateKey(privateKey: string): string | null {
  try {
    const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
    return keypair.publicKey.toBase58();
  } catch {
    return null;
  }
}

/**
 * Check USDC balance of a wallet
 */
export async function getUsdcBalance(walletAddress: string): Promise<number> {
  try {
    const usdcMintAddress = SOLANA_CONFIG.usdcMint;
    if (!usdcMintAddress) {
      throw new Error('USDC mint address not configured');
    }

    const connection = new Connection(SOLANA_CONFIG.rpcUrl, 'confirmed');
    const walletPublicKey = new PublicKey(walletAddress);
    const usdcMintPublicKey = new PublicKey(usdcMintAddress);

    const tokenAccount = await getAssociatedTokenAddress(
      usdcMintPublicKey,
      walletPublicKey
    );

    const account = await getAccount(connection, tokenAccount);
    return Number(account.amount) / Math.pow(10, USDC_DECIMALS);
  } catch {
    return 0;
  }
}
