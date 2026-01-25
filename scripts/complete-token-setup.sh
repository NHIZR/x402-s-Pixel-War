#!/bin/bash
# 网络恢复后执行此脚本完成 Token 设置
# 预计执行时间: 5 分钟

set -e

echo "🚀 完成 Devnet Token 设置"
echo "================================"
echo ""

# 切换到项目目录
cd "$(dirname "$0")/.."

# 配置 Solana CLI
echo "📝 配置 Solana CLI..."
solana config set --url devnet
solana config set --keypair wallets/treasury-wallet.json

# 检查余额
echo ""
echo "💰 检查 Treasury 钱包余额..."
BALANCE=$(solana balance)
echo "余额: $BALANCE"

if [[ "$BALANCE" == "0 SOL" ]]; then
  echo "⚠️  警告: Treasury 钱包余额为 0"
  echo "请先从水龙头获取 SOL: https://faucet.quicknode.com/solana/devnet"
  echo "钱包地址: H7yThEThcDYFe7BGx9iHuXs4WMAWB3yux4DL9wGFqqbn"
  exit 1
fi

# Token 信息
TOKEN_MINT="BBPTeW3Snc8hJzt2pNdY1VPCDLoGsAGBnxZkfMtjnauG"
FAUCET_ADDR="7g7ceJWE1GuKEsCYA2uiHwncxtHXZUejd1W3cKQiTqnL"

echo ""
echo "📦 创建 Token Account (Treasury)..."
~/.cargo/bin/spl-token create-account "$TOKEN_MINT" || echo "Token account 可能已存在，继续..."

echo ""
echo "🪙 铸造 1,000,000 USDC 到 Treasury..."
~/.cargo/bin/spl-token mint "$TOKEN_MINT" 1000000

echo ""
echo "📦 创建 Token Account (Faucet)..."
~/.cargo/bin/spl-token create-account "$TOKEN_MINT" \
  --owner wallets/faucet-wallet.json || echo "Token account 可能已存在，继续..."

echo ""
echo "💸 转移 500,000 USDC 到 Faucet..."
~/.cargo/bin/spl-token transfer "$TOKEN_MINT" 500000 "$FAUCET_ADDR"

echo ""
echo "✅ 验证余额..."
echo ""
echo "Treasury 余额:"
~/.cargo/bin/spl-token balance "$TOKEN_MINT"

echo ""
echo "Faucet 余额:"
~/.cargo/bin/spl-token balance "$TOKEN_MINT" --owner wallets/faucet-wallet.json

echo ""
echo "================================"
echo "✅ Token 设置完成！"
echo ""
echo "📋 摘要信息："
echo "  - Token Mint: $TOKEN_MINT"
echo "  - Treasury: H7yThEThcDYFe7BGx9iHuXs4WMAWB3yux4DL9wGFqqbn"
echo "  - Faucet: $FAUCET_ADDR"
echo "  - Treasury 余额: 500,000 USDC"
echo "  - Faucet 余额: 500,000 USDC"
echo ""
echo "🎯 下一步："
echo "  1. 执行数据库迁移 (Supabase Dashboard)"
echo "  2. 运行 npm run dev 启动开发服务器"
echo "  3. 按照 docs/TESTING_GUIDE.md 进行测试"
echo ""
