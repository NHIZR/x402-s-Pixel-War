/**
 * Pixel Conquest API Route
 *
 * Allows AI agents to programmatically purchase pixels.
 * Agent provides their private key to sign the transaction server-side.
 *
 * POST /api/pixels/conquer
 * Body: {
 *   privateKey: string,     // Base58 encoded private key
 *   pixels: Array<{x: number, y: number, color: string}>
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processServerPayment, getWalletAddressFromPrivateKey } from '@/lib/services/serverPayment';
import { checkRateLimit } from '@/lib/utils/rateLimit';

// Vercel Serverless Function config
export const maxDuration = 60;

// Rate limiting constants
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute

// Create Supabase client for API route
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing');
  }

  return createClient(supabaseUrl, supabaseKey);
}

interface PixelInput {
  x: number;
  y: number;
  color: string;
}

interface ConquerRequest {
  privateKey: string;
  pixels: PixelInput[];
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: ConquerRequest = await request.json();
    const { privateKey, pixels } = body;

    // Validate private key
    if (!privateKey || typeof privateKey !== 'string') {
      return NextResponse.json(
        { success: false, error: 'privateKey is required' },
        { status: 400 }
      );
    }

    // Validate pixels array
    if (!pixels || !Array.isArray(pixels) || pixels.length === 0) {
      return NextResponse.json(
        { success: false, error: 'pixels array is required and must not be empty' },
        { status: 400 }
      );
    }

    if (pixels.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Maximum 100 pixels per request' },
        { status: 400 }
      );
    }

    // Validate each pixel
    for (const pixel of pixels) {
      if (typeof pixel.x !== 'number' || typeof pixel.y !== 'number') {
        return NextResponse.json(
          { success: false, error: 'Each pixel must have numeric x and y coordinates' },
          { status: 400 }
        );
      }
      if (pixel.x < 0 || pixel.x >= 100 || pixel.y < 0 || pixel.y >= 100) {
        return NextResponse.json(
          { success: false, error: `Pixel coordinates must be between 0-99. Invalid: (${pixel.x}, ${pixel.y})` },
          { status: 400 }
        );
      }
      if (!pixel.color || !/^#[0-9A-Fa-f]{6}$/.test(pixel.color)) {
        return NextResponse.json(
          { success: false, error: `Invalid color format. Must be hex color like #FF0000. Got: ${pixel.color}` },
          { status: 400 }
        );
      }
    }

    // Get wallet address from private key
    const walletAddress = getWalletAddressFromPrivateKey(privateKey);
    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Invalid private key format' },
        { status: 400 }
      );
    }

    // Check rate limit
    const rateLimitResult = checkRateLimit(
      `conquer:${walletAddress}`,
      MAX_REQUESTS_PER_WINDOW,
      RATE_LIMIT_WINDOW_MS
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Please wait before making more requests.',
          resetAt: new Date(rateLimitResult.resetAt || Date.now()).toISOString(),
        },
        { status: 429 }
      );
    }

    // Get current pixel prices from database
    const supabase = getSupabaseClient();

    const coordinates = pixels.map(p => `(${p.x},${p.y})`);
    const { data: pixelData, error: fetchError } = await supabase
      .from('pixels')
      .select('x, y, current_price, wallet_owner')
      .or(pixels.map(p => `and(x.eq.${p.x},y.eq.${p.y})`).join(','));

    if (fetchError) {
      console.error('Failed to fetch pixel data:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch pixel prices' },
        { status: 500 }
      );
    }

    // Create price map
    const priceMap = new Map<string, { price: number; owner: string | null }>();
    for (const p of pixelData || []) {
      priceMap.set(`${p.x},${p.y}`, { price: p.current_price, owner: p.wallet_owner });
    }

    // Calculate total price and validate pixels
    let totalPrice = 0;
    const pixelsWithPrices: Array<{ x: number; y: number; color: string; price: number }> = [];

    for (const pixel of pixels) {
      const key = `${pixel.x},${pixel.y}`;
      const info = priceMap.get(key);

      if (!info) {
        return NextResponse.json(
          { success: false, error: `Pixel (${pixel.x}, ${pixel.y}) not found` },
          { status: 400 }
        );
      }

      // Skip if already owned by this wallet
      if (info.owner === walletAddress) {
        continue;
      }

      totalPrice += info.price;
      pixelsWithPrices.push({
        x: pixel.x,
        y: pixel.y,
        color: pixel.color,
        price: info.price,
      });
    }

    if (pixelsWithPrices.length === 0) {
      return NextResponse.json(
        {
          success: true,
          message: 'All pixels are already owned by this wallet',
          totalPixels: 0,
          totalPaid: 0,
        },
        { status: 200 }
      );
    }

    // Process payment
    const paymentResult = await processServerPayment(privateKey, totalPrice);

    if (!paymentResult.success) {
      return NextResponse.json(
        { success: false, error: paymentResult.error || 'Payment failed' },
        { status: 400 }
      );
    }

    // Update database via batch RPC
    const pixelsData = pixelsWithPrices.map(p => ({
      x: p.x,
      y: p.y,
      color: p.color,
    }));

    const { data: conquestData, error: conquestError } = await supabase.rpc('conquer_pixels_batch', {
      p_pixels: pixelsData,
      p_wallet_address: walletAddress,
      p_tx_hash: paymentResult.txHash || '',
    });

    if (conquestError) {
      console.error('Database update failed:', conquestError);
      return NextResponse.json(
        {
          success: false,
          error: 'Payment succeeded but database update failed. Please contact support.',
          txHash: paymentResult.txHash,
        },
        { status: 500 }
      );
    }

    // Success response
    return NextResponse.json(
      {
        success: true,
        walletAddress,
        totalPixels: conquestData.totalPixels,
        successCount: conquestData.successCount,
        skippedCount: conquestData.skippedCount || 0,
        errorCount: conquestData.errorCount,
        totalPaid: totalPrice,
        txHash: paymentResult.txHash,
        explorerUrl: `https://explorer.solana.com/tx/${paymentResult.txHash}?cluster=devnet`,
        results: conquestData.results,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Conquer API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/pixels/conquer
 * Returns API usage information
 */
export async function GET() {
  return NextResponse.json(
    {
      endpoint: 'Pixel Conquest API',
      method: 'POST',
      description: 'Programmatically purchase pixels using your wallet private key',
      rateLimit: '10 requests per minute',
      maxPixelsPerRequest: 100,
      usage: {
        privateKey: 'Your wallet private key (base58 encoded)',
        pixels: [
          { x: 0, y: 0, color: '#FF0000' },
          { x: 1, y: 0, color: '#00FF00' },
        ],
      },
      example: `curl -X POST ${process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app'}/api/pixels/conquer \\
  -H "Content-Type: application/json" \\
  -d '{"privateKey": "your-base58-private-key", "pixels": [{"x": 0, "y": 0, "color": "#FF0000"}]}'`,
      warning: 'Never share your private key. This API is for AI agents only.',
    },
    { status: 200 }
  );
}
