/**
 * Cron Job: Process Pending Conquest Jobs
 * 
 * Runs every minute to process pending jobs in the queue.
 * Configure in vercel.json with schedule: "star/1 star star star star"
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processServerPayment, getWalletAddressFromPrivateKey } from '@/lib/services/serverPayment';
import { getJob, updateJob, ConquestJob } from '@/lib/services/jobQueue';

// Cron secret for authentication
const CRON_SECRET = process.env.CRON_SECRET || 'your-cron-secret-here';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing');
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Process a single job
 */
async function processJob(job: ConquestJob): Promise<void> {
  console.log(`[Cron] Processing job ${job.id}...`);
  
  try {
    // Mark as processing
    await updateJob(job.id, 'processing');

    // Process payment
    const paymentResult = await processServerPayment(job.privateKey, job.totalPrice);

    if (!paymentResult.success) {
      await updateJob(job.id, 'failed', {
        success: false,
        error: paymentResult.error || 'Payment failed',
      });
      console.log(`[Cron] Job ${job.id} failed: ${paymentResult.error}`);
      return;
    }

    // Update database
    const supabase = getSupabaseClient();
    const pixelsData = job.pixels.map(p => ({
      x: p.x,
      y: p.y,
      color: p.color,
    }));

    const { data: conquestData, error: conquestError } = await supabase.rpc('conquer_pixels_batch', {
      p_pixels: pixelsData,
      p_wallet_address: job.walletAddress,
      p_tx_hash: paymentResult.txHash || '',
    });

    if (conquestError) {
      await updateJob(job.id, 'failed', {
        success: false,
        error: 'Payment succeeded but database update failed.',
        txHash: paymentResult.txHash,
      });
      console.log(`[Cron] Job ${job.id} failed: database error`);
      return;
    }

    // Mark as completed
    await updateJob(job.id, 'completed', {
      success: true,
      txHash: paymentResult.txHash,
      totalPixels: conquestData.totalPixels,
      successCount: conquestData.successCount,
      skippedCount: conquestData.skippedCount || 0,
      errorCount: conquestData.errorCount,
      totalPaid: job.totalPrice,
      explorerUrl: `https://explorer.solana.com/tx/${paymentResult.txHash}?cluster=devnet`,
      results: conquestData.results,
    });
    
    console.log(`[Cron] Job ${job.id} completed successfully`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await updateJob(job.id, 'failed', {
      success: false,
      error: errorMessage,
    });
    console.error(`[Cron] Job ${job.id} failed with error:`, errorMessage);
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (if configured)
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && CRON_SECRET !== 'your-cron-secret-here') {
      if (!authHeader || authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    // Get all pending jobs from Supabase
    const supabase = getSupabaseClient();
    const { data: pendingJobs, error } = await supabase
      .from('conquest_jobs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(5); // Process max 5 jobs per minute

    if (error) {
      console.error('[Cron] Failed to fetch pending jobs:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch pending jobs' },
        { status: 500 }
      );
    }

    if (!pendingJobs || pendingJobs.length === 0) {
      return NextResponse.json(
        { success: true, message: 'No pending jobs', processed: 0 },
        { status: 200 }
      );
    }

    // Process jobs sequentially
    const results = [];
    for (const dbJob of pendingJobs) {
      // Get full job with private key
      const job = await getJob(dbJob.id);
      if (job && job.status === 'pending') {
        await processJob(job);
        results.push(job.id);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Processed ${results.length} jobs`,
        processed: results.length,
        jobIds: results,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('[Cron] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggering
export const POST = GET;
