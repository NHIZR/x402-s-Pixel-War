-- Create conquest_jobs table for async job processing
CREATE TABLE IF NOT EXISTS conquest_jobs (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'pending',
  wallet_address TEXT NOT NULL,
  pixels JSONB NOT NULL,
  total_price NUMERIC NOT NULL,
  private_key TEXT NOT NULL,  -- Required for processing payment
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast status queries
CREATE INDEX IF NOT EXISTS idx_conquest_jobs_status ON conquest_jobs(status);
CREATE INDEX IF NOT EXISTS idx_conquest_jobs_created_at ON conquest_jobs(created_at);

-- Enable RLS (Row Level Security) if needed
-- ALTER TABLE conquest_jobs ENABLE ROW LEVEL SECURITY;

-- Clean up old jobs (optional: keep only last 24 hours)
-- DELETE FROM conquest_jobs WHERE created_at < NOW() - INTERVAL '24 hours';
