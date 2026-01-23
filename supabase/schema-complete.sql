-- =====================================================
-- x402's PIXEL WAR - COMPLETE DATABASE SCHEMA
-- =====================================================
-- Version: 2.0 (Batch Conquest Optimized)
-- Date: 2026-01-23
--
-- This is the complete, production-ready schema that includes:
-- 1. Wallet-based authentication (no Supabase Auth required)
-- 2. Batch conquest with graceful skip handling
-- 3. Free recolor functionality for owned pixels
-- 4. Real-time synchronization support
--
-- USAGE:
-- Execute this file in Supabase SQL Editor to set up the complete database.
-- This replaces the need for multiple migration files.
--
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PART 1: WALLET INTEGRATION BRIDGE
-- =====================================================

-- Add wallet_address column to pixels for direct wallet integration
ALTER TABLE pixels ADD COLUMN IF NOT EXISTS wallet_owner VARCHAR(100);

-- Create index for wallet owner lookups
CREATE INDEX IF NOT EXISTS idx_pixels_wallet_owner ON pixels(wallet_owner);

-- =====================================================
-- PART 2: CORE CONQUEST FUNCTIONS (OPTIMIZED)
-- =====================================================

-- 1. Conquer a single pixel with graceful skip handling
CREATE OR REPLACE FUNCTION conquer_pixel_wallet(
  p_pixel_x INTEGER,
  p_pixel_y INTEGER,
  p_wallet_address VARCHAR(100),
  p_new_color VARCHAR(7),
  p_tx_hash VARCHAR(100)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pixel RECORD;
  v_price DECIMAL(20, 8);
  v_new_price DECIMAL(20, 8);
  v_previous_owner VARCHAR(100);
BEGIN
  -- Lock the pixel row for update
  SELECT * INTO v_pixel
  FROM pixels
  WHERE x = p_pixel_x AND y = p_pixel_y
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pixel not found');
  END IF;

  -- 🔥 OPTIMIZATION: Skip already-owned pixels gracefully (return success without changes)
  -- This prevents batch operations from failing when user selects their own pixels
  IF v_pixel.wallet_owner = p_wallet_address THEN
    RETURN jsonb_build_object(
      'success', true,
      'skipped', true,
      'reason', 'Already owned',
      'pixel', jsonb_build_object(
        'x', p_pixel_x,
        'y', p_pixel_y,
        'color', v_pixel.color,
        'newPrice', v_pixel.current_price,
        'walletOwner', p_wallet_address
      ),
      'transaction', jsonb_build_object(
        'pricePaid', 0,  -- No payment for already-owned pixels
        'newPrice', v_pixel.current_price
      )
    );
  END IF;

  v_price := v_pixel.current_price;
  v_previous_owner := v_pixel.wallet_owner;
  v_new_price := v_price * 1.20;  -- 20% price increase

  -- Update pixel ownership
  UPDATE pixels
  SET
    wallet_owner = p_wallet_address,
    color = p_new_color,
    current_price = v_new_price,
    conquest_count = conquest_count + 1,
    last_conquered_at = NOW(),
    updated_at = NOW()
  WHERE x = p_pixel_x AND y = p_pixel_y;

  RETURN jsonb_build_object(
    'success', true,
    'skipped', false,
    'pixel', jsonb_build_object(
      'x', p_pixel_x,
      'y', p_pixel_y,
      'color', p_new_color,
      'newPrice', v_new_price,
      'walletOwner', p_wallet_address
    ),
    'transaction', jsonb_build_object(
      'pricePaid', v_price,
      'newPrice', v_new_price,
      'txHash', p_tx_hash,
      'previousOwner', v_previous_owner
    )
  );
END;
$$;

-- 2. Batch conquer with accurate skip tracking
CREATE OR REPLACE FUNCTION conquer_pixels_batch(
  p_pixels JSONB,
  p_wallet_address VARCHAR(100),
  p_tx_hash VARCHAR(100)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pixel_item JSONB;
  v_results JSONB[] := '{}';
  v_success_count INTEGER := 0;
  v_skipped_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_total_paid DECIMAL(20, 8) := 0;
  v_pixel_result JSONB;
BEGIN
  FOR v_pixel_item IN SELECT * FROM jsonb_array_elements(p_pixels)
  LOOP
    v_pixel_result := conquer_pixel_wallet(
      (v_pixel_item->>'x')::INTEGER,
      (v_pixel_item->>'y')::INTEGER,
      p_wallet_address,
      v_pixel_item->>'color',
      p_tx_hash
    );

    v_results := array_append(v_results, v_pixel_result);

    IF (v_pixel_result->>'success')::BOOLEAN THEN
      IF COALESCE((v_pixel_result->>'skipped')::BOOLEAN, false) THEN
        v_skipped_count := v_skipped_count + 1;
      ELSE
        v_success_count := v_success_count + 1;
        v_total_paid := v_total_paid + COALESCE((v_pixel_result->'transaction'->>'pricePaid')::DECIMAL, 0);
      END IF;
    ELSE
      v_error_count := v_error_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', v_error_count = 0,
    'totalPixels', jsonb_array_length(p_pixels),
    'successCount', v_success_count,
    'skippedCount', v_skipped_count,
    'errorCount', v_error_count,
    'totalPaid', v_total_paid,
    'txHash', p_tx_hash,
    'results', to_jsonb(v_results)
  );
END;
$$;

-- =====================================================
-- PART 3: FREE RECOLOR FUNCTIONS
-- =====================================================

-- 3. Recolor a single owned pixel (free)
CREATE OR REPLACE FUNCTION recolor_pixel_wallet(
  p_pixel_x INTEGER,
  p_pixel_y INTEGER,
  p_wallet_address VARCHAR(100),
  p_new_color VARCHAR(7)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pixel RECORD;
BEGIN
  -- Lock the pixel
  SELECT * INTO v_pixel
  FROM pixels
  WHERE x = p_pixel_x AND y = p_pixel_y
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pixel not found');
  END IF;

  -- Only allow recoloring owned pixels
  IF v_pixel.wallet_owner != p_wallet_address THEN
    RETURN jsonb_build_object('success', false, 'error', 'You do not own this pixel');
  END IF;

  -- Update only color (no price change, no conquest count increase)
  UPDATE pixels
  SET
    color = p_new_color,
    updated_at = NOW()
  WHERE x = p_pixel_x AND y = p_pixel_y;

  RETURN jsonb_build_object(
    'success', true,
    'pixel', jsonb_build_object(
      'x', p_pixel_x,
      'y', p_pixel_y,
      'color', p_new_color,
      'currentPrice', v_pixel.current_price,
      'walletOwner', p_wallet_address
    )
  );
END;
$$;

-- 4. Batch recolor owned pixels (free)
CREATE OR REPLACE FUNCTION recolor_pixels_batch(
  p_pixels JSONB,
  p_wallet_address VARCHAR(100)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pixel_item JSONB;
  v_results JSONB[] := '{}';
  v_success_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_pixel_result JSONB;
BEGIN
  FOR v_pixel_item IN SELECT * FROM jsonb_array_elements(p_pixels)
  LOOP
    v_pixel_result := recolor_pixel_wallet(
      (v_pixel_item->>'x')::INTEGER,
      (v_pixel_item->>'y')::INTEGER,
      p_wallet_address,
      v_pixel_item->>'color'
    );

    v_results := array_append(v_results, v_pixel_result);

    IF (v_pixel_result->>'success')::BOOLEAN THEN
      v_success_count := v_success_count + 1;
    ELSE
      v_error_count := v_error_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', v_error_count = 0,
    'totalPixels', jsonb_array_length(p_pixels),
    'successCount', v_success_count,
    'errorCount', v_error_count,
    'results', to_jsonb(v_results)
  );
END;
$$;

-- =====================================================
-- PART 4: QUERY FUNCTIONS
-- =====================================================

-- 5. Get grid state with wallet owners
CREATE OR REPLACE FUNCTION get_grid_state_wallet()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'x', x,
      'y', y,
      'color', color,
      'currentPrice', current_price,
      'ownerId', COALESCE(wallet_owner, owner_id::TEXT),
      'walletOwner', wallet_owner,
      'conquestCount', conquest_count,
      'lastConqueredAt', last_conquered_at
    ) ORDER BY y, x
  ) INTO v_result
  FROM pixels;

  RETURN v_result;
END;
$$;

-- 6. Get pixels owned by a specific wallet
CREATE OR REPLACE FUNCTION get_wallet_pixels(p_wallet_address VARCHAR(100))
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_result JSONB;
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM pixels
  WHERE wallet_owner = p_wallet_address;

  SELECT jsonb_build_object(
    'walletAddress', p_wallet_address,
    'totalPixels', v_count,
    'pixels', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'x', x,
          'y', y,
          'color', color,
          'currentPrice', current_price,
          'conquestCount', conquest_count,
          'lastConqueredAt', last_conquered_at
        )
      )
      FROM pixels
      WHERE wallet_owner = p_wallet_address
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- =====================================================
-- PART 5: ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Add RLS policy for wallet-based access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'pixels'
    AND policyname = 'Wallet users can update pixels via RPC'
  ) THEN
    CREATE POLICY "Wallet users can update pixels via RPC"
      ON pixels FOR UPDATE
      USING (true)
      WITH CHECK (true);
  END IF;
END
$$;

-- =====================================================
-- PART 6: FUNCTION COMMENTS
-- =====================================================

COMMENT ON FUNCTION conquer_pixel_wallet IS 'Conquer a pixel - skips already-owned pixels gracefully';
COMMENT ON FUNCTION conquer_pixels_batch IS 'Batch conquer multiple pixels with skip tracking';
COMMENT ON FUNCTION recolor_pixel_wallet IS 'Recolor an owned pixel for free';
COMMENT ON FUNCTION recolor_pixels_batch IS 'Batch recolor owned pixels for free';
COMMENT ON FUNCTION get_grid_state_wallet IS 'Get grid state with wallet owner information';
COMMENT ON FUNCTION get_wallet_pixels IS 'Get all pixels owned by a specific wallet address';

-- =====================================================
-- SETUP COMPLETE
-- =====================================================
--
-- Next steps:
-- 1. Enable Realtime for pixels table (if not already enabled):
--    ALTER PUBLICATION supabase_realtime ADD TABLE pixels;
--
-- 2. Initialize the grid (if not already done):
--    SELECT initialize_grid();
--
-- 3. Verify functions exist:
--    SELECT routine_name FROM information_schema.routines
--    WHERE routine_schema = 'public' AND routine_name LIKE '%pixel%';
--
-- You should see 6 functions:
-- - conquer_pixel_wallet
-- - conquer_pixels_batch
-- - recolor_pixel_wallet
-- - recolor_pixels_batch
-- - get_grid_state_wallet
-- - get_wallet_pixels
--
-- =====================================================
