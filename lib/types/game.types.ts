// TypeScript type definitions for x402's War

export interface Pixel {
  id: string;
  x: number;
  y: number;
  color: string;
  currentPrice: number;
  ownerId: string | null;
  conquestCount: number;
  lastConqueredAt: string | null;
  lastTxHash?: string | null; // Solana transaction hash
  lastTxTimestamp?: string | null; // Transaction timestamp
  txCount?: number; // Total transaction count
  owner?: UserProfile; // Joined data (optional)
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string | null;
  walletAddress: string | null;
  x402Balance: number;
  totalPixelsOwned: number;
  totalSpent: number;
  totalEarned: number;
  preferredColor: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  pixelId: string;
  pixelX: number;
  pixelY: number;
  buyerId: string;
  sellerId: string | null;
  pricePaid: number;
  sellerProfit: number | null;
  warTax: number;
  newColor: string;
  transactionType: string;
  createdAt: string;
}

// New interface for Solana blockchain transactions
export interface PixelTransaction {
  id: string;
  pixelX: number;
  pixelY: number;
  txHash: string; // Solana transaction signature
  fromWallet: string | null; // Previous owner
  toWallet: string; // New owner
  usdcAmount: number; // Amount paid in USDC
  txTimestamp: string; // Blockchain confirmation time
  createdAt: string; // Database record creation time
}

export interface Treasury {
  id: string;
  totalAccumulated: number;
  lastUpdated: string;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  displayName: string | null;
  totalPixelsOwned: number;
  totalSpent: number;
  totalEarned: number;
  netProfit: number;
  currentPixelsOwned: number;
}

// Game state interface
export interface GameState {
  pixels: Pixel[][];
  loading: boolean;
  error: string | null;
}

// Conquest result from RPC
export interface ConquestResult {
  success: boolean;
  error?: string;
  required?: number;
  available?: number;
  txHash?: string; // Solana transaction hash
  pixel?: {
    x: number;
    y: number;
    color: string;
    newPrice: number;
    walletOwner?: string;
    lastTxHash?: string;
  };
  transaction?: {
    pricePaid: number;
    sellerProfit: number;
    warTax: number;
    buyerNewBalance: number;
    txHash?: string;
    previousOwner?: string | null;
  };
}

// User stats from RPC
export interface UserStats {
  username: string;
  displayName: string | null;
  balance: number;
  totalPixelsOwned: number;
  totalSpent: number;
  totalEarned: number;
  netProfit: number;
  preferredColor: string;
}

// Database row types (snake_case from Postgres)
export interface PixelRow {
  id: string;
  x: number;
  y: number;
  color: string;
  current_price: number;
  owner_id: string | null;
  wallet_owner?: string | null;
  conquest_count: number;
  last_conquered_at: string | null;
  last_tx_hash?: string | null;
  last_tx_timestamp?: string | null;
  tx_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ProfileRow {
  id: string;
  username: string;
  display_name: string | null;
  wallet_address: string | null;
  x402_balance: number;
  total_pixels_owned: number;
  total_spent: number;
  total_earned: number;
  preferred_color: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionRow {
  id: string;
  pixel_id: string;
  pixel_x: number;
  pixel_y: number;
  buyer_id: string;
  seller_id: string | null;
  price_paid: number;
  seller_profit: number | null;
  war_tax: number;
  new_color: string;
  transaction_type: string;
  created_at: string;
}

// New database row type for Solana blockchain transactions
export interface PixelTransactionRow {
  id: string;
  pixel_x: number;
  pixel_y: number;
  tx_hash: string;
  from_wallet: string | null;
  to_wallet: string;
  usdc_amount: number;
  tx_timestamp: string;
  created_at: string;
}

// Conversion utilities
export function pixelFromRow(row: PixelRow): Pixel {
  return {
    id: row.id,
    x: row.x,
    y: row.y,
    color: row.color,
    currentPrice: row.current_price,
    ownerId: row.owner_id,
    conquestCount: row.conquest_count,
    lastConqueredAt: row.last_conquered_at,
    lastTxHash: row.last_tx_hash,
    lastTxTimestamp: row.last_tx_timestamp,
    txCount: row.tx_count,
  };
}

export function profileFromRow(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    walletAddress: row.wallet_address,
    x402Balance: row.x402_balance,
    totalPixelsOwned: row.total_pixels_owned,
    totalSpent: row.total_spent,
    totalEarned: row.total_earned,
    preferredColor: row.preferred_color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function transactionFromRow(row: TransactionRow): Transaction {
  return {
    id: row.id,
    pixelId: row.pixel_id,
    pixelX: row.pixel_x,
    pixelY: row.pixel_y,
    buyerId: row.buyer_id,
    sellerId: row.seller_id,
    pricePaid: row.price_paid,
    sellerProfit: row.seller_profit,
    warTax: row.war_tax,
    newColor: row.new_color,
    transactionType: row.transaction_type,
    createdAt: row.created_at,
  };
}

export function pixelTransactionFromRow(row: PixelTransactionRow): PixelTransaction {
  return {
    id: row.id,
    pixelX: row.pixel_x,
    pixelY: row.pixel_y,
    txHash: row.tx_hash,
    fromWallet: row.from_wallet,
    toWallet: row.to_wallet,
    usdcAmount: row.usdc_amount,
    txTimestamp: row.tx_timestamp,
    createdAt: row.created_at,
  };
}
