/**
 * Job Queue Service
 *
 * Manages async conquest jobs using Supabase as storage.
 * Jobs are created immediately and processed in the background.
 */

import { createClient } from '@supabase/supabase-js';

export interface ConquestJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  walletAddress: string;
  pixels: Array<{ x: number; y: number; color: string; price: number }>;
  totalPrice: number;
  privateKey: string; // Encrypted or hashed in production
  result?: {
    success: boolean;
    txHash?: string;
    totalPixels?: number;
    successCount?: number;
    skippedCount?: number;
    errorCount?: number;
    totalPaid?: number;
    error?: string;
    explorerUrl?: string;
    results?: any[];
  };
  createdAt: string;
  updatedAt: string;
}

// In-memory job storage (for serverless, resets on cold start)
// In production, use Supabase table for persistence
const jobStore = new Map<string, ConquestJob>();

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing');
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Generate a unique job ID
 */
export function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a new conquest job
 */
export async function createJob(
  walletAddress: string,
  pixels: Array<{ x: number; y: number; color: string; price: number }>,
  totalPrice: number,
  privateKey: string
): Promise<string> {
  const jobId = generateJobId();
  const now = new Date().toISOString();

  const job: ConquestJob = {
    id: jobId,
    status: 'pending',
    walletAddress,
    pixels,
    totalPrice,
    privateKey,
    createdAt: now,
    updatedAt: now,
  };

  // Store in memory
  jobStore.set(jobId, job);

  // Also store in Supabase for persistence
  try {
    const supabase = getSupabaseClient();
    await supabase.from('conquest_jobs').insert({
      id: jobId,
      status: 'pending',
      wallet_address: walletAddress,
      pixels: JSON.stringify(pixels),
      total_price: totalPrice,
      created_at: now,
      updated_at: now,
    });
  } catch (e) {
    // If Supabase table doesn't exist, continue with in-memory only
    console.warn('Could not persist job to Supabase:', e);
  }

  return jobId;
}

/**
 * Get job by ID
 */
export async function getJob(jobId: string): Promise<ConquestJob | null> {
  // Check in-memory first
  const memJob = jobStore.get(jobId);
  if (memJob) {
    return memJob;
  }

  // Try Supabase
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('conquest_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error || !data) {
      return null;
    }

    // Convert from DB format
    const job: ConquestJob = {
      id: data.id,
      status: data.status,
      walletAddress: data.wallet_address,
      pixels: JSON.parse(data.pixels || '[]'),
      totalPrice: data.total_price,
      privateKey: '', // Don't return private key
      result: data.result ? JSON.parse(data.result) : undefined,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return job;
  } catch (e) {
    return null;
  }
}

/**
 * Update job status and result
 */
export async function updateJob(
  jobId: string,
  status: ConquestJob['status'],
  result?: ConquestJob['result']
): Promise<void> {
  const now = new Date().toISOString();

  // Update in-memory
  const memJob = jobStore.get(jobId);
  if (memJob) {
    memJob.status = status;
    memJob.result = result;
    memJob.updatedAt = now;
  }

  // Update in Supabase
  try {
    const supabase = getSupabaseClient();
    await supabase
      .from('conquest_jobs')
      .update({
        status,
        result: result ? JSON.stringify(result) : null,
        updated_at: now,
      })
      .eq('id', jobId);
  } catch (e) {
    console.warn('Could not update job in Supabase:', e);
  }
}

/**
 * Get pending job for processing (in-memory only)
 */
export function getPendingJob(): ConquestJob | null {
  for (const job of jobStore.values()) {
    if (job.status === 'pending') {
      return job;
    }
  }
  return null;
}

/**
 * Clean up old jobs (older than 1 hour)
 */
export function cleanupOldJobs(): void {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;

  for (const [jobId, job] of jobStore.entries()) {
    const createdAt = new Date(job.createdAt).getTime();
    if (createdAt < oneHourAgo) {
      jobStore.delete(jobId);
    }
  }
}
