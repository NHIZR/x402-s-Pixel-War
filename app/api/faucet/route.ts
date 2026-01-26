/**
 * Faucet API Route
 * Distributes test USDC tokens to users with rate limiting
 */

import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { distributeFaucetTokens } from '@/lib/services/faucet';
import { checkRateLimit } from '@/lib/utils/rateLimit';

// Vercel Serverless Function config - extend timeout for Solana transactions
export const maxDuration = 60; // 60 seconds (max for Hobby plan)

// Constants
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_REQUESTS_PER_WINDOW = 1; // 1 request per 24 hours

/**
 * POST /api/faucet
 * Request body: { walletAddress: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { walletAddress } = body;

    // Validate wallet address
    if (!walletAddress || typeof walletAddress !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request: walletAddress is required',
        },
        { status: 400 }
      );
    }

    // Validate wallet address format
    try {
      new PublicKey(walletAddress);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid wallet address format',
        },
        { status: 400 }
      );
    }

    // Check rate limit
    const rateLimitResult = checkRateLimit(
      walletAddress,
      MAX_REQUESTS_PER_WINDOW,
      RATE_LIMIT_WINDOW_MS
    );

    if (!rateLimitResult.allowed) {
      const resetAt = rateLimitResult.resetAt || Date.now();
      const resetDate = new Date(resetAt);
      const hoursRemaining = Math.ceil((resetAt - Date.now()) / (1000 * 60 * 60));

      return NextResponse.json(
        {
          success: false,
          error: `Rate limit exceeded. You can request tokens again in ${hoursRemaining} hour(s)`,
          resetAt: resetDate.toISOString(),
        },
        { status: 429 }
      );
    }

    // Distribute tokens
    const result = await distributeFaucetTokens(walletAddress);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to distribute tokens',
        },
        { status: 500 }
      );
    }

    // Success response
    return NextResponse.json(
      {
        success: true,
        message: `Successfully sent ${result.amount} USDC to ${walletAddress}`,
        txHash: result.txHash,
        amount: result.amount,
        explorerUrl: `https://explorer.solana.com/tx/${result.txHash}?cluster=testnet`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Faucet API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/faucet
 * Returns faucet information and status
 */
export async function GET() {
  return NextResponse.json(
    {
      faucet: 'Test USDC Faucet (powered by x402)',
      amount: 100,
      rateLimit: '1 request per 24 hours',
      network: 'Solana Testnet',
      usage: 'POST to this endpoint with { walletAddress: "your-wallet-address" }',
    },
    { status: 200 }
  );
}
