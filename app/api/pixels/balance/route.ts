/**
 * Wallet Balance API Route
 *
 * Check USDC and SOL balance for a wallet.
 *
 * GET /api/pixels/balance?wallet=YOUR_WALLET_ADDRESS
 */

import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import { SOLANA_CONFIG } from '@/lib/config/solana';

const USDC_DECIMALS = 6;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const wallet = searchParams.get('wallet');

    if (!wallet) {
      return NextResponse.json({
        endpoint: 'Wallet Balance API',
        usage: '/api/pixels/balance?wallet=YOUR_WALLET_ADDRESS',
        description: 'Check USDC and SOL balance for a wallet',
      });
    }

    // Validate wallet address
    let walletPublicKey: PublicKey;
    try {
      walletPublicKey = new PublicKey(wallet);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    const usdcMintAddress = SOLANA_CONFIG.usdcMint;
    if (!usdcMintAddress) {
      return NextResponse.json(
        { success: false, error: 'USDC mint not configured' },
        { status: 500 }
      );
    }

    const connection = new Connection(SOLANA_CONFIG.rpcUrl, 'confirmed');

    // Get SOL balance
    const solBalance = await connection.getBalance(walletPublicKey);
    const solBalanceFormatted = solBalance / LAMPORTS_PER_SOL;

    // Get USDC balance
    let usdcBalance = 0;
    try {
      const usdcMintPublicKey = new PublicKey(usdcMintAddress);
      const tokenAccount = await getAssociatedTokenAddress(
        usdcMintPublicKey,
        walletPublicKey
      );
      const account = await getAccount(connection, tokenAccount);
      usdcBalance = Number(account.amount) / Math.pow(10, USDC_DECIMALS);
    } catch {
      // Token account doesn't exist, balance is 0
      usdcBalance = 0;
    }

    return NextResponse.json({
      success: true,
      wallet,
      balances: {
        sol: solBalanceFormatted,
        usdc: usdcBalance,
      },
      network: SOLANA_CONFIG.network,
      faucetAvailable: usdcBalance < 1, // Suggest faucet if low balance
      faucetUrl: '/api/faucet',
    });

  } catch (error) {
    console.error('Balance API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
