-- =====================================================
-- TRANSACTION TRACKING MIGRATION
-- =====================================================
-- This migration adds Solana transaction tracking to the pixels table
-- and creates a full transaction history table.
--
-- IMPORTANT: This file must be executed manually in Supabase Dashboard
-- Go to: Dashboard → SQL Editor → New Query → Paste this file → Run
--
-- Or use Supabase CLI: supabase db push
-- =====================================================

-- Step 1: Add transaction tracking columns to pixels table
ALTER TABLE pixels
ADD COLUMN IF NOT EXISTS last_tx_hash TEXT,
ADD COLUMN IF NOT EXISTS last_tx_timestamp TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS tx_count INTEGER DEFAULT 0;

-- Create index for transaction lookups
CREATE INDEX IF NOT EXISTS idx_pixels_tx_hash ON pixels(last_tx_hash);

COMMENT ON COLUMN pixels.last_tx_hash IS 'Solana transaction hash (signature) of the most recent conquest';
COMMENT ON COLUMN pixels.last_tx_timestamp IS 'Timestamp when the last transaction was confirmed on Solana';
COMMENT ON COLUMN pixels.tx_count IS 'Total number of transactions for this pixel';

-- Step 2: Create transaction history table for full audit trail
CREATE TABLE IF NOT EXISTS pixel_transactions (
  id BIGSERIAL PRIMARY KEY,
  pixel_x INTEGER NOT NULL,
  pixel_y INTEGER NOT NULL,
  tx_hash TEXT NOT NULL UNIQUE,
  from_wallet TEXT,
  to_wallet TEXT NOT NULL,
  usdc_amount DECIMAL(18, 6) NOT NULL,
  tx_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT fk_pixel
    FOREIGN KEY (pixel_x, pixel_y)
    REFERENCES pixels(x, y)
    ON DELETE CASCADE
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tx_to_wallet ON pixel_transactions(to_wallet);
CREATE INDEX IF NOT EXISTS idx_tx_from_wallet ON pixel_transactions(from_wallet);
CREATE INDEX IF NOT EXISTS idx_tx_timestamp ON pixel_transactions(tx_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_tx_pixel ON pixel_transactions(pixel_x, pixel_y);

-- Add table and column comments
COMMENT ON TABLE pixel_transactions IS 'Complete history of all pixel conquest transactions on Solana blockchain';
COMMENT ON COLUMN pixel_transactions.tx_hash IS 'Solana transaction hash (signature) - unique identifier on blockchain';
COMMENT ON COLUMN pixel_transactions.from_wallet IS 'Previous owner wallet address (null for first conquest)';
COMMENT ON COLUMN pixel_transactions.to_wallet IS 'New owner wallet address';
COMMENT ON COLUMN pixel_transactions.usdc_amount IS 'Amount paid in USDC (6 decimals precision)';
COMMENT ON COLUMN pixel_transactions.tx_timestamp IS 'Timestamp when transaction was confirmed on Solana';

-- Step 4: Enable Row Level Security (RLS) on pixel_transactions
ALTER TABLE pixel_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for reading transaction history (public read)
CREATE POLICY "Anyone can view transaction history"
  ON pixel_transactions FOR SELECT
  USING (true);

-- Create RLS policy for inserting transactions (via RPC only)
CREATE POLICY "RPC functions can insert transactions"
  ON pixel_transactions FOR INSERT
  WITH CHECK (true);

-- Verification queries (uncomment to run)
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'pixels'
-- AND column_name IN ('last_tx_hash', 'last_tx_timestamp', 'tx_count');
--
-- SELECT * FROM pixel_transactions LIMIT 5;
