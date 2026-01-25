/**
 * Pixel Conquest Service
 *
 * Handles the complete flow of conquering pixels:
 * 1. Payment via x402 (real SPL token transfers)
 * 2. Database update via Supabase RPC
 * 3. Real-time synchronization
 *
 * NOTE: This service uses direct SPL token transfers.
 * For X402 protocol integration, see:
 * - lib/services/x402PaymentV2.ts (X402 client)
 * - app/api/x402/conquer-pixel/route.ts (X402 server)
 *
 * TODO: Integrate X402 protocol flow when ready
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { createClient } from '@/lib/supabase/client';
import { processPayment, PaymentResult } from '@/lib/services/x402Payment';
import { FEATURES } from '@/lib/config/features';

// Display warning if X402 is enabled but not fully integrated
if (typeof window !== 'undefined' && FEATURES.enableX402) {
  console.warn('⚠️ X402 is enabled but pixelConquest still uses direct SPL transfers');
  console.warn('💡 For full X402 integration, the game logic needs to be updated');
  console.warn('📚 See: docs/X402_BACKEND_API.md for implementation details');
}

export interface ConquestResult {
  success: boolean;
  error?: string;
  txHash?: string;
  pixel?: {
    x: number;
    y: number;
    color: string;
    newPrice: number;
    walletOwner: string;
  };
  transaction?: {
    pricePaid: number;
    newPrice: number;
    previousOwner?: string;
  };
}

export interface BatchConquestResult {
  success: boolean;
  error?: string;
  totalPixels: number;
  successCount: number;
  skippedCount?: number;
  errorCount: number;
  totalPaid: number;
  txHash?: string;
  results?: ConquestResult[];
}

/**
 * Conquer a single pixel
 */
export async function conquerPixel(
  connection: Connection,
  walletPublicKey: PublicKey,
  sendTransaction: any,
  pixelX: number,
  pixelY: number,
  color: string,
  price: number
): Promise<ConquestResult> {
  try {
    const walletAddress = walletPublicKey.toBase58();

    // Step 1: Process payment via real SPL token transfer
    const paymentResult: PaymentResult = await processPayment(
      connection,
      walletPublicKey,
      sendTransaction,
      price
    );

    if (!paymentResult.success) {
      return {
        success: false,
        error: paymentResult.error || '支付失败'
      };
    }

    // Step 2: Update database via RPC
    const supabase = createClient();

    const { data, error } = await supabase.rpc('conquer_pixel_wallet', {
      p_pixel_x: pixelX,
      p_pixel_y: pixelY,
      p_wallet_address: walletAddress,
      p_new_color: color,
      p_tx_hash: paymentResult.txHash || ''
    });

    if (error) {
      console.error('Database update failed:', error);
      return {
        success: false,
        error: `数据库更新失败: ${error.message}`
      };
    }

    // Check if the RPC function returned success
    if (data && !data.success) {
      return {
        success: false,
        error: data.error || '占领失败'
      };
    }

    // Step 3: Return success (real-time sync happens automatically via Supabase)
    return {
      success: true,
      txHash: paymentResult.txHash,
      pixel: data.pixel,
      transaction: data.transaction
    };

  } catch (error) {
    console.error('Conquer pixel error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

/**
 * Conquer multiple pixels in a batch
 */
export async function conquerPixelsBatch(
  connection: Connection,
  walletPublicKey: PublicKey,
  sendTransaction: any,
  pixels: Array<{ x: number; y: number; color: string; price: number }>,
  totalPrice: number
): Promise<BatchConquestResult> {
  try {
    const walletAddress = walletPublicKey.toBase58();

    // Step 1: Process batch payment via real SPL token transfer
    const paymentResult: PaymentResult = await processPayment(
      connection,
      walletPublicKey,
      sendTransaction,
      totalPrice
    );

    if (!paymentResult.success) {
      return {
        success: false,
        error: paymentResult.error || '批量支付失败',
        totalPixels: pixels.length,
        successCount: 0,
        errorCount: pixels.length,
        totalPaid: 0
      };
    }

    // Step 2: Update database via batch RPC
    const supabase = createClient();

    // Format pixels for RPC function
    const pixelsData = pixels.map(p => ({
      x: p.x,
      y: p.y,
      color: p.color
    }));

    const { data, error } = await supabase.rpc('conquer_pixels_batch', {
      p_pixels: pixelsData,
      p_wallet_address: walletAddress,
      p_tx_hash: paymentResult.txHash || ''
    });

    if (error) {
      console.error('Batch database update failed:', error);
      return {
        success: false,
        error: `批量更新失败: ${error.message}`,
        totalPixels: pixels.length,
        successCount: 0,
        errorCount: pixels.length,
        totalPaid: 0
      };
    }

    // Return batch results
    return {
      success: data.success,
      totalPixels: data.totalPixels,
      successCount: data.successCount,
      skippedCount: data.skippedCount || 0,
      errorCount: data.errorCount,
      totalPaid: data.totalPaid,
      txHash: paymentResult.txHash,
      results: data.results
    };

  } catch (error) {
    console.error('Batch conquer error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      totalPixels: pixels.length,
      successCount: 0,
      errorCount: pixels.length,
      totalPaid: 0
    };
  }
}

/**
 * Recolor a pixel owned by the user (free, no payment)
 */
export async function recolorPixel(
  walletAddress: string,
  pixelX: number,
  pixelY: number,
  color: string
): Promise<ConquestResult> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.rpc('recolor_pixel_wallet', {
      p_pixel_x: pixelX,
      p_pixel_y: pixelY,
      p_wallet_address: walletAddress,
      p_new_color: color
    });

    if (error) {
      console.error('Recolor failed:', error);
      return {
        success: false,
        error: `换色失败: ${error.message}`
      };
    }

    if (data && !data.success) {
      return {
        success: false,
        error: data.error || '换色失败'
      };
    }

    return {
      success: true,
      pixel: data.pixel
    };

  } catch (error) {
    console.error('Recolor pixel error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

/**
 * Recolor multiple pixels in a batch (free, for owned pixels only)
 */
export async function recolorPixelsBatch(
  walletAddress: string,
  pixels: Array<{ x: number; y: number; color: string }>
): Promise<BatchConquestResult> {
  try {
    const supabase = createClient();

    const pixelsData = pixels.map(p => ({
      x: p.x,
      y: p.y,
      color: p.color
    }));

    const { data, error } = await supabase.rpc('recolor_pixels_batch', {
      p_pixels: pixelsData,
      p_wallet_address: walletAddress
    });

    if (error) {
      console.error('Batch recolor failed:', error);
      return {
        success: false,
        error: `批量换色失败: ${error.message}`,
        totalPixels: pixels.length,
        successCount: 0,
        errorCount: pixels.length,
        totalPaid: 0
      };
    }

    return {
      success: data.success,
      totalPixels: data.totalPixels,
      successCount: data.successCount,
      errorCount: data.errorCount,
      totalPaid: 0, // Free recolor
      results: data.results
    };

  } catch (error) {
    console.error('Batch recolor error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      totalPixels: pixels.length,
      successCount: 0,
      errorCount: pixels.length,
      totalPaid: 0
    };
  }
}

/**
 * Get all pixels owned by a wallet
 */
export async function getWalletPixels(walletAddress: string) {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.rpc('get_wallet_pixels', {
      p_wallet_address: walletAddress
    });

    if (error) {
      console.error('Failed to get wallet pixels:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Get wallet pixels error:', error);
    return null;
  }
}
