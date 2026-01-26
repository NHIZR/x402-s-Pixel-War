/**
 * Shared utilities for scripts
 */

import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, getAccount } from '@solana/spl-token';
import bs58 from 'bs58';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Load environment variables from .env.local
 */
export function loadEnvFile(): Record<string, string> {
  try {
    const envPath = join(process.cwd(), '.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    const env: Record<string, string> = {};

    envContent.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...values] = line.split('=');
        if (key && values.length > 0) {
          env[key.trim()] = values.join('=').trim();
        }
      }
    });

    return env;
  } catch {
    console.error('Unable to read .env.local file');
    return {};
  }
}

/**
 * Get Solana connection from env
 */
export function getConnection(env: Record<string, string>): Connection {
  const rpcUrl = env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  console.log('RPC:', rpcUrl);
  return new Connection(rpcUrl, 'confirmed');
}

/**
 * Load keypair from base58 private key
 */
export function loadKeypair(privateKeyBase58: string): Keypair {
  return Keypair.fromSecretKey(bs58.decode(privateKeyBase58));
}

/**
 * Check and display SOL balance
 */
export async function checkSOLBalance(connection: Connection, publicKey: PublicKey): Promise<number> {
  const balance = await connection.getBalance(publicKey);
  const solBalance = balance / LAMPORTS_PER_SOL;
  console.log('SOL Balance:', solBalance.toFixed(4), 'SOL');
  return balance;
}

/**
 * Setup token account for a wallet
 */
export async function setupTokenAccount(
  connection: Connection,
  payer: Keypair,
  owner: PublicKey,
  mintAddress: string,
  walletName: string
): Promise<{ tokenAccount: PublicKey; balance: number; created: boolean }> {
  const mintPublicKey = new PublicKey(mintAddress);
  const tokenAccount = await getAssociatedTokenAddress(mintPublicKey, owner);

  console.log(`\n${walletName} Token Account:`, tokenAccount.toBase58());

  // Check if account exists
  let balance = 0;
  let created = false;

  try {
    const account = await getAccount(connection, tokenAccount);
    balance = Number(account.amount) / 1_000_000; // USDC has 6 decimals
    console.log('Token account exists');
    console.log('USDC Balance:', balance.toFixed(2), 'USDC');
  } catch {
    console.log('Token account does not exist, creating...');

    const solBalance = await connection.getBalance(payer.publicKey);
    if (solBalance < 0.01 * LAMPORTS_PER_SOL) {
      throw new Error('Insufficient SOL to create token account (need at least 0.01 SOL)');
    }

    const transaction = new Transaction().add(
      createAssociatedTokenAccountInstruction(
        payer.publicKey,
        tokenAccount,
        owner,
        mintPublicKey
      )
    );

    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [payer],
      { commitment: 'confirmed' }
    );

    console.log('Token account created!');
    console.log('Transaction:', signature);
    console.log('Explorer: https://explorer.solana.com/tx/' + signature + '?cluster=devnet');
    created = true;
  }

  return { tokenAccount, balance, created };
}
