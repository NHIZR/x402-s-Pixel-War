/**
 * Job Status API Route
 *
 * Check the status of an async conquest job.
 *
 * GET /api/pixels/job?id=JOB_ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { getJob } from '@/lib/services/jobQueue';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobId = searchParams.get('id');

    if (!jobId) {
      return NextResponse.json(
        {
          endpoint: 'Job Status API',
          usage: '/api/pixels/job?id=JOB_ID',
          description: 'Check the status of an async conquest job',
          statuses: {
            pending: 'Job is waiting to be processed',
            processing: 'Job is currently being processed',
            completed: 'Job finished successfully',
            failed: 'Job failed with an error',
          },
        },
        { status: 200 }
      );
    }

    const job = await getJob(jobId);

    if (!job) {
      return NextResponse.json(
        {
          success: false,
          error: 'Job not found. It may have expired (jobs are kept for 1 hour).',
        },
        { status: 404 }
      );
    }

    // Return job status without sensitive data
    const response: any = {
      success: true,
      jobId: job.id,
      status: job.status,
      walletAddress: job.walletAddress,
      totalPixels: job.pixels.length,
      estimatedPrice: job.totalPrice,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };

    // Include result if job is completed or failed
    if (job.status === 'completed' || job.status === 'failed') {
      response.result = job.result;
    }

    // Add helpful message based on status
    switch (job.status) {
      case 'pending':
        response.message = 'Job is queued and waiting to be processed. Please poll again in a few seconds.';
        response.retryAfter = 2; // seconds
        break;
      case 'processing':
        response.message = 'Job is currently being processed. This may take up to 60 seconds.';
        response.retryAfter = 5; // seconds
        break;
      case 'completed':
        response.message = 'Job completed successfully!';
        break;
      case 'failed':
        response.message = 'Job failed. See result.error for details.';
        break;
    }

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Job Status API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
