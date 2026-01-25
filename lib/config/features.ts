/**
 * Feature Flags Configuration
 *
 * 功能开关,用于安全地测试新功能
 */

export const FEATURES = {
  /**
   * 启用 X402 支付协议
   *
   * false (默认): 使用当前的自定义 SPL Token 支付
   * true: 使用 X402 协议进行支付
   *
   * 如何启用:
   * 1. 设置环境变量: NEXT_PUBLIC_ENABLE_X402=true
   * 2. 或者直接修改这个文件 (不推荐,容易忘记改回来)
   */
  enableX402: process.env.NEXT_PUBLIC_ENABLE_X402 === 'true',

  /**
   * X402 配置
   */
  x402Config: {
    // 使用 Circle 官方 DevNet USDC
    usdcMint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
    // PayAI Facilitator URL
    facilitatorUrl: 'https://facilitator.payai.network',
  },
} as const;

/**
 * 获取当前应该使用的 USDC Mint 地址
 */
export function getUSDCMint(): string {
  if (FEATURES.enableX402) {
    return FEATURES.x402Config.usdcMint;
  }
  // 使用环境变量中配置的自定义 Token
  return process.env.NEXT_PUBLIC_USDC_MINT_ADDRESS || '';
}

/**
 * 调试信息 (仅在开发环境打印)
 */
if (process.env.NODE_ENV === 'development') {
  console.log('🎯 Feature Flags:', {
    enableX402: FEATURES.enableX402,
    usdcMint: getUSDCMint(),
  });
}
