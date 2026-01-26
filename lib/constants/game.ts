/**
 * Game Configuration Constants
 */

// Grid dimensions
export const GRID_WIDTH = 64;
export const GRID_HEIGHT = 36;
export const TOTAL_PIXELS = GRID_WIDTH * GRID_HEIGHT;

// Pricing
export const INITIAL_PIXEL_PRICE = 0.01; // USDC
export const PRICE_INCREASE_MULTIPLIER = 1.2; // 20% increase per conquest
export const SELLER_PROFIT_RATE = 1.1; // Seller gets principal + 10%
export const WAR_TAX_RATE = 0.1; // 10% war tax to platform

// UI Settings
export const PIXEL_FLASH_DURATION = 1000; // ms
export const TOAST_DURATION_SHORT = 3000; // ms
export const TOAST_DURATION_LONG = 6000; // ms

// Real-time sync
export const REALTIME_CHANNEL = 'pixels-changes';
export const BALANCE_REFRESH_INTERVAL = 30000; // 30 seconds

// Network
export const DEFAULT_NETWORK = 'devnet';
export const SUPPORTED_NETWORKS = ['devnet', 'mainnet-beta', 'testnet'] as const;

// Mock payment settings
export const MOCK_PAYMENT_MIN_DELAY = 500; // ms
export const MOCK_PAYMENT_MAX_DELAY = 1500; // ms
export const MOCK_PAYMENT_FAILURE_RATE = 0.05; // 5%
export const MOCK_BATCH_PAYMENT_MIN_DELAY = 1000; // ms
export const MOCK_BATCH_PAYMENT_MAX_DELAY = 3000; // ms
export const MOCK_BATCH_PAYMENT_FAILURE_RATE = 0.03; // 3%

// Validation
export const MIN_PIXEL_PRICE = 0.01;
export const MAX_BATCH_SELECTION = 100; // Maximum pixels in one batch operation

// Color palette presets
export const DEFAULT_COLORS = [
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FF6600', // Orange
  '#9900FF', // Purple
  '#00FF99', // Spring Green
  '#FF0099', // Hot Pink
];

// Error messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: '请先连接钱包',
  INSUFFICIENT_BALANCE: '余额不足',
  PIXEL_NOT_FOUND: '像素不存在',
  ALREADY_OWNER: '你已经拥有这个像素',
  INVALID_PRICE: '价格无效',
  NETWORK_ERROR: '网络错误，请重试',
  DATABASE_ERROR: '数据库错误',
  UNKNOWN_ERROR: '未知错误',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  PIXEL_CONQUERED: '占领成功！',
  BATCH_CONQUERED: '批量占领成功！',
  WALLET_CONNECTED: '钱包已连接',
} as const;
