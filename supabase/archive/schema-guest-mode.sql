-- x402's Pixel War - Database Schema (Guest Mode)
-- Simplified schema without user authentication
-- Only includes pixel grid for viewing

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CLEANUP (Remove old tables if they exist)
-- =====================================================

DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS treasury CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS pixels CASCADE;

-- Drop materialized view if exists
DROP MATERIALIZED VIEW IF EXISTS leaderboard CASCADE;

-- =====================================================
-- TABLES
-- =====================================================

-- Pixels Table (50x30 grid = 1,500 pixels)
CREATE TABLE pixels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  x INTEGER NOT NULL CHECK (x >= 0 AND x < 50),
  y INTEGER NOT NULL CHECK (y >= 0 AND y < 30),
  color VARCHAR(7) NOT NULL DEFAULT '#0a0a0a', -- Current pixel color (cyber-black)
  current_price DECIMAL(20, 8) NOT NULL DEFAULT 0.01, -- Current price (1 cent)
  owner_id UUID, -- NULL for guest mode
  conquest_count INTEGER DEFAULT 0, -- How many times this pixel was conquered
  last_conquered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(x, y) -- Ensure one record per coordinate
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_pixels_coordinates ON pixels(x, y);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

ALTER TABLE pixels ENABLE ROW LEVEL SECURITY;

-- Pixels: Everyone can read (guest mode)
CREATE POLICY "Pixels are viewable by everyone"
  ON pixels FOR SELECT
  USING (true);

-- =====================================================
-- FUNCTIONS (RPCs)
-- =====================================================

-- Initialize grid with 1,500 pixels (50x30)
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

  -- Create 50x30 grid
  FOR i IN 0..49 LOOP
    FOR j IN 0..29 LOOP
      INSERT INTO pixels (x, y, color, current_price, conquest_count)
      VALUES (i, j, '#0a0a0a', 0.01, 0);
    END LOOP;
  END LOOP;
END;
$$;

-- Get grid state efficiently
CREATE OR REPLACE FUNCTION get_grid_state()
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
      'ownerId', owner_id,
      'conquestCount', conquest_count,
      'lastConqueredAt', last_conquered_at
    ) ORDER BY y, x
  ) INTO v_result
  FROM pixels;

  RETURN v_result;
END;
$$;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pixels_updated_at BEFORE UPDATE ON pixels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INITIALIZATION
-- =====================================================

-- Run this to initialize the grid:
SELECT initialize_grid();

COMMENT ON TABLE pixels IS '50x30 pixel grid state for viewing (guest mode)';
COMMENT ON FUNCTION get_grid_state IS 'Efficiently retrieve the entire grid state as JSON';
COMMENT ON FUNCTION initialize_grid IS 'Initialize the 50x30 grid with default values';
