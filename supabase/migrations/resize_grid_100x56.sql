-- =====================================================
-- PIXEL WAR - RESIZE GRID TO 100x56
-- =====================================================
-- Version: 4.0
-- Date: 2026-01-26
--
-- This migration resizes the pixel grid from 64x36 to 100x56
-- Total pixels: 5,600
-- WARNING: This will DELETE all existing pixel data!
--
-- =====================================================

-- 1. First, remove the old check constraints (they were for 64x36)
ALTER TABLE pixels DROP CONSTRAINT IF EXISTS pixels_x_check;
ALTER TABLE pixels DROP CONSTRAINT IF EXISTS pixels_y_check;

-- 2. Add new check constraints for 100x56
ALTER TABLE pixels ADD CONSTRAINT pixels_x_check CHECK (x >= 0 AND x < 100);
ALTER TABLE pixels ADD CONSTRAINT pixels_y_check CHECK (y >= 0 AND y < 56);

-- 3. Drop and recreate initialize_grid function for 100x56
CREATE OR REPLACE FUNCTION initialize_grid()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  i INTEGER;
  j INTEGER;
BEGIN
  -- Delete existing pixels
  DELETE FROM pixels;

  -- Create 100x56 grid (5,600 pixels)
  FOR i IN 0..99 LOOP
    FOR j IN 0..55 LOOP
      INSERT INTO pixels (x, y, color, current_price, conquest_count)
      VALUES (i, j, '#0a0a0a', 0.01, 0);
    END LOOP;
  END LOOP;
END;
$$;

-- 4. Update function comment
COMMENT ON FUNCTION initialize_grid IS 'Initialize the 100x56 grid with default values (5,600 pixels)';

-- =====================================================
-- USAGE:
-- 1. Run this entire migration in Supabase SQL Editor
-- 2. Then run: SELECT initialize_grid();
-- 3. Verify: SELECT COUNT(*) FROM pixels; -- Should return 5600
-- =====================================================
