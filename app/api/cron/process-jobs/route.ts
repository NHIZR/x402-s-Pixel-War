/**
 * Cron Job: Process Pending Conquest Jobs
 * 
 * Runs every minute to process pending jobs from Supabase.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { processServerPayment } from '@/lib/services/serverPayment';

// Allow longer execution for cron jobs (Vercel supports up to 300s on Pro)
export const maxDuration = 300;

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
async function processJob(supabase: any, job: any): Promise<void> {
  console.log(`[Cron] Processing job ${job.id}...`);
  
  try {
    // Mark as processing
    await supabase
      .from('conquest_jobs')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', job.id);

    // Parse pixels
    const pixels = typeof job.pixels === 'string' ? JSON.parse(job.pixels) : job.pixels;
    
    // Process payment (this is the slow part - Solana devnet can be slow)
    const paymentResult = await processServerPayment(job.private_key, job.total_price);

    if (!paymentResult.success) {
      await supabase
        .from('conquest_jobs')
        .update({
          status: 'failed',
          result: JSON.stringify({ success: false, error: paymentResult.error || 'Payment failed' }),
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id);
      console.log(`[Cron] Job ${job.id} failed: ${paymentResult.error}`);
      return;
    }

    // Update database via batch RPC
    const pixelsData = pixels.map((p: any) => ({ x: p.x, y: p.y, color: p.color }));
    
    const { data: conquestData, error: conquestError } = await supabase.rpc('conquer_pixels_batch', {
      p_pixels: pixelsData,
      p_wallet_address: job.wallet_address,
      p_tx_hash: paymentResult.txHash || '',
    });

    if (conquestError) {
      await supabase
        .from('conquest_jobs')
        .update({
          status: 'failed',
          result: JSON.stringify({
            success: false,
            error: 'Payment succeeded but database update failed.',
            txHash: paymentResult.txHash
          }),
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id);
      console.log(`[Cron] Job ${job.id} failed: database error`, conquestError);
      return;
    }

    // Mark as completed
    await supabase
      .from('conquest_jobs')
      .update({
        status: 'completed',
        result: JSON.stringify({
          success: true,
          txHash: paymentResult.txHash,
          totalPixels: conquestData?.totalPixels || pixels.length,
          successCount: conquestData?.successCount || pixels.length,
          explorerUrl: `https://explorer.solana.com/tx/${paymentResult.txHash}?cluster=devnet`,
        }),
        updated_at: new Date().toISOString()
      })
      .eq('id', job.id);
    
    console.log(`[Cron] Job ${job.id} completed successfully`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await supabase
      .from('conquest_jobs')
      .update({
        status: 'failed',
        result: JSON.stringify({ success: false, error: errorMessage }),
        updated_at: new Date().toISOString()
      })
      .eq('id', job.id);
    console.error(`[Cron] Job ${job.id} failed:`, errorMessage);
  }
}

export async function GET(request: NextRequest) {
  // Verify this is a cron request or manual trigger
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';
  const isManual = !isVercelCron; // Allow manual triggers for testing
  
  if (!isVercelCron && !isManual) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSupabaseClient();
    
    // Get all pending jobs
    const { data: pendingJobs, error } = await supabase
      .from('conquest_jobs')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(3); // Process max 3 jobs per run

    if (error) {
      console.error('[Cron] Failed to fetch jobs:', error);
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }

    if (!pendingJobs || pendingJobs.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No pending jobs',
        processed: 0 
      });
    }

    // Process jobs one by one
    const results = [];
    for (const job of pendingJobs) {
      await processJob(supabase, job);
      results.push(job.id);
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      jobIds: results
    });

  } catch (error) {
    console.error('[Cron] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export const POST = GET;
