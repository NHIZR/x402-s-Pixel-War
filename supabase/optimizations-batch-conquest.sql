-- =====================================================
-- BATCH CONQUEST OPTIMIZATIONS
-- =====================================================
-- This migration fixes the batch conquest failure issue where already-owned
-- pixels cause errors during batch operations.

-- 1. Update conquer_pixel_wallet to skip already-owned pixels gracefully
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

  -- 🔥 FIX: Skip already-owned pixels silently (return success without changes)
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
        'pricePaid', 0,
        'newPrice', v_pixel.current_price
      )
    );
  END IF;

  v_price := v_pixel.current_price;
  v_previous_owner := v_pixel.wallet_owner;
  v_new_price := v_price * 1.20;

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

-- 2. Update batch function to correctly handle skipped pixels
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

-- 3. Add recolor function for owned pixels (free)
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

-- 4. Add batch recolor function
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

COMMENT ON FUNCTION conquer_pixel_wallet IS 'Conquer a pixel - skips already-owned pixels gracefully';
COMMENT ON FUNCTION recolor_pixel_wallet IS 'Recolor an owned pixel for free';
COMMENT ON FUNCTION recolor_pixels_batch IS 'Batch recolor owned pixels for free';
