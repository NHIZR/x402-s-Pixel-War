/**
 * 价格计算工具函数
 * 用于客户端预览和显示
 * 注意：服务端 RPC 是实际价格计算的权威来源
 */

// 计算新价格（增长 20%）
export function calculateNewPrice(currentPrice: number): number {
  return currentPrice * 1.2;
}

// 计算卖家利润（本金 + 10%）
export function calculateSellerProfit(price: number): number {
  return price * 1.1;
}

// 计算战争税（10%）
export function calculateWarTax(price: number): number {
  return price * 0.1;
}

// 格式化价格显示
export function formatPrice(price: number): string {
  if (price < 0.01) {
    return price.toFixed(4);
  } else if (price < 1) {
    return price.toFixed(3);
  } else if (price < 1000) {
    return price.toFixed(2);
  } else if (price < 1000000) {
    return (price / 1000).toFixed(2) + 'K';
  } else {
    return (price / 1000000).toFixed(2) + 'M';
  }
}

// 格式化余额显示（带 x402 单位）
export function formatBalance(balance: number): string {
  return `${formatPrice(balance)} x402`;
}

// 计算经过 N 次占领后的价格
export function calculatePriceAfterConquests(
  initialPrice: number,
  conquests: number
): number {
  return initialPrice * Math.pow(1.2, conquests);
}

// 计算占领 N 次的总成本
export function calculateTotalCost(
  initialPrice: number,
  conquests: number
): number {
  let total = 0;
  let currentPrice = initialPrice;

  for (let i = 0; i < conquests; i++) {
    total += currentPrice;
    currentPrice *= 1.2;
  }

  return total;
}

// 验证颜色格式
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(color);
}

// 生成随机颜色（排除纯黑）
export function generateRandomColor(): string {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  // 避免生成纯黑色
  if (color === '#000000' || color === '#0a0a0a') {
    return generateRandomColor();
  }
  return color;
}

// 获取对比色（用于文字显示）
export function getContrastColor(hexColor: string): string {
  // 移除 # 号
  const hex = hexColor.replace('#', '');

  // 转换为 RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // 计算亮度
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  // 根据亮度返回黑色或白色
  return brightness > 128 ? '#0a0a0a' : '#ededed';
}
