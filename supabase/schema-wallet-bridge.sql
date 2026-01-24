-- =====================================================
-- WALLET INTEGRATION BRIDGE
-- =====================================================
-- This file extends the main schema to support Solana wallet-based authentication
-- without requiring Supabase Auth (for faster hackathon development)

-- Add wallet_address column to pixels for direct wallet integration
ALTER TABLE pixels ADD COLUMN IF NOT EXISTS wallet_owner VARCHAR(100);

-- Create wallet-based conquer function
CREATE OR REPLACE FUNCTION conquer_pixel_wallet(
  p_pixel_x INTEGER,
  p_pixel_y INTEGER,
  p_wallet_address VARCHAR(100),
  p_new_color VARCHAR(7),
  p_tx_hash TEXT -- Solana transaction hash (signature)
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
  v_result JSONB;
BEGIN
  -- Lock the pixel row for update (prevents concurrent conquests)
  SELECT * INTO v_pixel
  FROM pixels
  WHERE x = p_pixel_x AND y = p_pixel_y
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pixel not found');
  END IF;

  -- Prevent self-conquest
  IF v_pixel.wallet_owner = p_wallet_address THEN
    RETURN jsonb_build_object('success', false, 'error', 'You already own this pixel');
  END IF;

  v_price := v_pixel.current_price;
  v_previous_owner := v_pixel.wallet_owner;

  -- Calculate new price (20% increase)
  v_new_price := v_price * 1.20;

  -- Update pixel ownership with transaction tracking
  UPDATE pixels
  SET
    wallet_owner = p_wallet_address,
    color = p_new_color,
    current_price = v_new_price,
    conquest_count = conquest_count + 1,
    last_conquered_at = NOW(),
    last_tx_hash = p_tx_hash,
    last_tx_timestamp = NOW(),
    tx_count = COALESCE(tx_count, 0) + 1,
    updated_at = NOW()
  WHERE x = p_pixel_x AND y = p_pixel_y;

  -- Insert transaction record into history table
  INSERT INTO pixel_transactions (
    pixel_x,
    pixel_y,
    tx_hash,
    from_wallet,
    to_wallet,
    usdc_amount,
    tx_timestamp
  ) VALUES (
    p_pixel_x,
    p_pixel_y,
    p_tx_hash,
    v_previous_owner,
    p_wallet_address,
    v_price,
    NOW()
  );

  -- Return success with details
  RETURN jsonb_build_object(
    'success', true,
    'txHash', p_tx_hash,
    'pixel', jsonb_build_object(
      'x', p_pixel_x,
      'y', p_pixel_y,
      'color', p_new_color,
      'newPrice', v_new_price,
      'walletOwner', p_wallet_address,
      'lastTxHash', p_tx_hash
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

-- Batch conquer function for multiple pixels
CREATE OR REPLACE FUNCTION conquer_pixels_batch(
  p_pixels JSONB, -- Array of {x, y, color}
  p_wallet_address VARCHAR(100),
  p_tx_hash TEXT -- Solana transaction hash (base)
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
  v_total_paid DECIMAL(20, 8) := 0;
  v_pixel_result JSONB;
  v_pixel_tx_hash TEXT;
BEGIN
  -- Process each pixel
  FOR v_pixel_item IN SELECT * FROM jsonb_array_elements(p_pixels)
  LOOP
    -- Create unique tx_hash for each pixel by appending coordinates
    v_pixel_tx_hash := p_tx_hash || '_' || (v_pixel_item->>'x') || '_' || (v_pixel_item->>'y');

    -- Conquer individual pixel with unique tx_hash
    v_pixel_result := conquer_pixel_wallet(
      (v_pixel_item->>'x')::INTEGER,
      (v_pixel_item->>'y')::INTEGER,
      p_wallet_address,
      v_pixel_item->>'color',
      v_pixel_tx_hash
    );

    -- Accumulate results
    v_results := array_append(v_results, v_pixel_result);

    IF (v_pixel_result->>'success')::BOOLEAN THEN
      v_success_count := v_success_count + 1;
      v_total_paid := v_total_paid + (v_pixel_result->'transaction'->>'pricePaid')::DECIMAL;
    ELSE
      v_error_count := v_error_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', v_error_count = 0,
    'totalPixels', jsonb_array_length(p_pixels),
    'successCount', v_success_count,
    'errorCount', v_error_count,
    'totalPaid', v_total_paid,
    'txHash', p_tx_hash,
    'results', to_jsonb(v_results)
  );
END;
$$;

-- Get grid state with wallet owners
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

-- Get pixels owned by a specific wallet
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

-- Add RLS policies for wallet-based access
CREATE POLICY "Wallet users can update pixels via RPC"
  ON pixels FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Note: In production, you'd want more restrictive policies
-- For hackathon MVP, allowing updates via RPC functions is sufficient

COMMENT ON FUNCTION conquer_pixel_wallet IS 'Conquer a pixel using Solana wallet address (no Supabase Auth required). Records Solana transaction hash and stores in pixel_transactions table.';
COMMENT ON FUNCTION conquer_pixels_batch IS 'Batch conquer multiple pixels in a single transaction. Each pixel gets a unique tx_hash by appending coordinates to base hash.';
COMMENT ON FUNCTION get_grid_state_wallet IS 'Get grid state with wallet owner information';
COMMENT ON FUNCTION get_wallet_pixels IS 'Get all pixels owned by a specific wallet address';
