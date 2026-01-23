-- x402's War - Database Schema
-- This schema implements the pixel conquest game with agentic economy mechanics

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLES
-- =====================================================

-- User Profiles Table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  wallet_address VARCHAR(100), -- For future crypto integration
  x402_balance DECIMAL(20, 8) DEFAULT 1000.00, -- Mock balance for MVP
  total_pixels_owned INTEGER DEFAULT 0,
  total_spent DECIMAL(20, 8) DEFAULT 0.00,
  total_earned DECIMAL(20, 8) DEFAULT 0.00,
  preferred_color VARCHAR(7) DEFAULT '#FF0000', -- Hex color for hybrid mode
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pixels Table (10x10 grid = 100 pixels)
CREATE TABLE pixels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  x INTEGER NOT NULL CHECK (x >= 0 AND x < 10),
  y INTEGER NOT NULL CHECK (y >= 0 AND y < 10),
  color VARCHAR(7) NOT NULL DEFAULT '#0a0a0a', -- Current pixel color (cyber-black)
  current_price DECIMAL(20, 8) NOT NULL DEFAULT 0.001, -- Current price to claim (adjusted)
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  conquest_count INTEGER DEFAULT 0, -- How many times this pixel was conquered
  last_conquered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(x, y) -- Ensure one record per coordinate
);

-- Transaction History
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pixel_id UUID NOT NULL REFERENCES pixels(id) ON DELETE CASCADE,
  pixel_x INTEGER NOT NULL,
  pixel_y INTEGER NOT NULL,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- NULL if unclaimed
  price_paid DECIMAL(20, 8) NOT NULL,
  seller_profit DECIMAL(20, 8), -- Principal + 10% profit
  war_tax DECIMAL(20, 8), -- 10% war tax
  new_color VARCHAR(7) NOT NULL,
  transaction_type VARCHAR(20) DEFAULT 'conquest', -- conquest, reclaim, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Treasury/War Tax Accumulation
CREATE TABLE treasury (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  total_accumulated DECIMAL(20, 8) DEFAULT 0.00,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_pixels_coordinates ON pixels(x, y);
CREATE INDEX idx_pixels_owner ON pixels(owner_id);
CREATE INDEX idx_transactions_buyer ON transactions(buyer_id);
CREATE INDEX idx_transactions_seller ON transactions(seller_id);
CREATE INDEX idx_transactions_pixel ON transactions(pixel_id);
CREATE INDEX idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX idx_profiles_username ON profiles(username);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pixels ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all, update only their own
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Pixels: Everyone can read, no direct updates (only via RPC)
CREATE POLICY "Pixels are viewable by everyone"
  ON pixels FOR SELECT
  USING (true);

-- Transactions: Everyone can read, inserts via RPC only
CREATE POLICY "Transactions are viewable by everyone"
  ON transactions FOR SELECT
  USING (true);

-- Treasury: Read-only for everyone
CREATE POLICY "Treasury is viewable by everyone"
  ON treasury FOR SELECT
  USING (true);

-- =====================================================
-- MATERIALIZED VIEW: Leaderboard
-- =====================================================

CREATE MATERIALIZED VIEW leaderboard AS
SELECT
  p.id,
  p.username,
  p.display_name,
  p.total_pixels_owned,
  p.total_spent,
  p.total_earned,
  (p.total_earned - p.total_spent) as net_profit,
  COUNT(px.id) as current_pixels_owned
FROM profiles p
LEFT JOIN pixels px ON px.owner_id = p.id
GROUP BY p.id
ORDER BY current_pixels_owned DESC, net_profit DESC;

-- Create index on materialized view
CREATE INDEX idx_leaderboard_rank ON leaderboard(current_pixels_owned DESC, net_profit DESC);

-- =====================================================
-- FUNCTIONS (RPCs)
-- =====================================================

-- Initialize grid with 100 pixels (0-9, 0-9)
CREATE OR REPLACE FUNCTION initialize_grid()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  i INTEGER;
  j INTEGER;
BEGIN
  FOR i IN 0..9 LOOP
    FOR j IN 0..9 LOOP
      INSERT INTO pixels (x, y, color, current_price, conquest_count)
      VALUES (i, j, '#0a0a0a', 0.001, 0)
      ON CONFLICT (x, y) DO NOTHING;
    END LOOP;
  END LOOP;

  -- Initialize treasury if not exists
  INSERT INTO treasury (total_accumulated)
  SELECT 0.00
  WHERE NOT EXISTS (SELECT 1 FROM treasury);
END;
$$;

-- Conquer pixel with atomic transaction
CREATE OR REPLACE FUNCTION conquer_pixel(
  p_pixel_x INTEGER,
  p_pixel_y INTEGER,
  p_buyer_id UUID,
  p_new_color VARCHAR(7)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pixel RECORD;
  v_buyer RECORD;
  v_seller RECORD;
  v_price DECIMAL(20, 8);
  v_seller_profit DECIMAL(20, 8);
  v_war_tax DECIMAL(20, 8);
  v_new_price DECIMAL(20, 8);
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

  -- Get buyer profile
  SELECT * INTO v_buyer
  FROM profiles
  WHERE id = p_buyer_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Buyer profile not found');
  END IF;

  -- Prevent self-conquest
  IF v_pixel.owner_id = p_buyer_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'You already own this pixel');
  END IF;

  v_price := v_pixel.current_price;

  -- Check if buyer has enough balance
  IF v_buyer.x402_balance < v_price THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient balance',
      'required', v_price,
      'available', v_buyer.x402_balance
    );
  END IF;

  -- Calculate profit distribution
  v_seller_profit := v_price * 1.10; -- Principal + 10% profit
  v_war_tax := v_price * 0.10; -- 10% war tax

  -- Deduct from buyer
  UPDATE profiles
  SET
    x402_balance = x402_balance - v_price,
    total_spent = total_spent + v_price,
    updated_at = NOW()
  WHERE id = p_buyer_id;

  -- Pay previous owner if exists
  IF v_pixel.owner_id IS NOT NULL THEN
    SELECT * INTO v_seller
    FROM profiles
    WHERE id = v_pixel.owner_id;

    UPDATE profiles
    SET
      x402_balance = x402_balance + v_seller_profit,
      total_earned = total_earned + v_seller_profit,
      total_pixels_owned = total_pixels_owned - 1,
      updated_at = NOW()
    WHERE id = v_pixel.owner_id;
  END IF;

  -- Add war tax to treasury
  UPDATE treasury
  SET
    total_accumulated = total_accumulated + v_war_tax,
    last_updated = NOW();

  -- Calculate new price (20% increase)
  v_new_price := v_price * 1.20;

  -- Update pixel ownership
  UPDATE pixels
  SET
    owner_id = p_buyer_id,
    color = p_new_color,
    current_price = v_new_price,
    conquest_count = conquest_count + 1,
    last_conquered_at = NOW(),
    updated_at = NOW()
  WHERE x = p_pixel_x AND y = p_pixel_y;

  -- Update new owner's pixel count
  UPDATE profiles
  SET
    total_pixels_owned = total_pixels_owned + 1,
    updated_at = NOW()
  WHERE id = p_buyer_id;

  -- Record transaction
  INSERT INTO transactions (
    pixel_id,
    pixel_x,
    pixel_y,
    buyer_id,
    seller_id,
    price_paid,
    seller_profit,
    war_tax,
    new_color
  ) VALUES (
    v_pixel.id,
    p_pixel_x,
    p_pixel_y,
    p_buyer_id,
    v_pixel.owner_id,
    v_price,
    CASE WHEN v_pixel.owner_id IS NOT NULL THEN v_seller_profit ELSE NULL END,
    v_war_tax,
    p_new_color
  );

  -- Return success with details
  RETURN jsonb_build_object(
    'success', true,
    'pixel', jsonb_build_object(
      'x', p_pixel_x,
      'y', p_pixel_y,
      'color', p_new_color,
      'newPrice', v_new_price
    ),
    'transaction', jsonb_build_object(
      'pricePaid', v_price,
      'sellerProfit', v_seller_profit,
      'warTax', v_war_tax,
      'buyerNewBalance', v_buyer.x402_balance - v_price
    )
  );
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

-- Refresh leaderboard materialized view
CREATE OR REPLACE FUNCTION refresh_leaderboard()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW leaderboard;
END;
$$;

-- Get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_profile RECORD;
  v_result JSONB;
BEGIN
  SELECT * INTO v_profile
  FROM profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Profile not found');
  END IF;

  RETURN jsonb_build_object(
    'username', v_profile.username,
    'displayName', v_profile.display_name,
    'balance', v_profile.x402_balance,
    'totalPixelsOwned', v_profile.total_pixels_owned,
    'totalSpent', v_profile.total_spent,
    'totalEarned', v_profile.total_earned,
    'netProfit', v_profile.total_earned - v_profile.total_spent,
    'preferredColor', v_profile.preferred_color
  );
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

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pixels_updated_at BEFORE UPDATE ON pixels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INITIALIZATION
-- =====================================================

-- Run this after deploying the schema:
-- SELECT initialize_grid();

COMMENT ON TABLE profiles IS 'User profiles with mock x402 token balances and game statistics';
COMMENT ON TABLE pixels IS '10x10 pixel grid state for the conquest game';
COMMENT ON TABLE transactions IS 'Complete history of all pixel conquests';
COMMENT ON TABLE treasury IS 'War tax accumulation from all conquests';
COMMENT ON FUNCTION conquer_pixel IS 'Atomically conquer a pixel with price inflation and profit distribution';
COMMENT ON FUNCTION get_grid_state IS 'Efficiently retrieve the entire grid state as JSON';
COMMENT ON FUNCTION initialize_grid IS 'Initialize the 10x10 grid with default values';
