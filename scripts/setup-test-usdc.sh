#!/bin/bash

# 测试 USDC 设置脚本
# 用于在 Solana Devnet 上创建测试 USDC Token

echo "==================================="
echo "Solana Devnet 测试 USDC 设置向导"
echo "==================================="
echo ""

# 检查 Solana CLI 是否安装
if ! command -v solana &> /dev/null; then
    echo "❌ 未检测到 Solana CLI"
    echo ""
    echo "请先安装 Solana CLI:"
    echo "  sh -c \"\$(curl -sSfL https://release.solana.com/stable/install)\""
    echo ""
    exit 1
fi

echo "✓ Solana CLI 已安装"
echo ""

# 检查 SPL Token CLI 是否安装
if ! command -v spl-token &> /dev/null; then
    echo "❌ 未检测到 SPL Token CLI"
    echo ""
    echo "请先安装 SPL Token CLI:"
    echo "  cargo install spl-token-cli"
    echo ""
    exit 1
fi

echo "✓ SPL Token CLI 已安装"
echo ""

# 配置到 Devnet
echo "📡 配置网络到 Devnet..."
solana config set --url devnet
echo ""

# 显示当前配置
echo "当前配置:"
solana config get
echo ""

# 检查余额
BALANCE=$(solana balance 2>/dev/null | awk '{print $1}')
echo "当前 SOL 余额: $BALANCE SOL"
echo ""

# 如果余额不足，提示空投
if (( $(echo "$BALANCE < 1" | bc -l) )); then
    echo "⚠️  余额不足！"
    echo ""
    read -p "是否请求 SOL 空投? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "请求 2 SOL 空投..."
        solana airdrop 2
        echo ""
        echo "新余额:"
        solana balance
        echo ""
    fi
fi

# 创建测试 USDC Token
echo "==================================="
echo "创建测试 USDC Token"
echo "==================================="
echo ""

read -p "是否创建新的测试 USDC Token? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "创建 Token (6 decimals, 像 USDC)..."
    MINT_OUTPUT=$(spl-token create-token --decimals 6 2>&1)
    MINT_ADDRESS=$(echo "$MINT_OUTPUT" | grep "Address:" | awk '{print $2}')

    echo ""
    echo "✓ Token 创建成功!"
    echo "Mint Address: $MINT_ADDRESS"
    echo ""

    # 创建 Token Account
    echo "创建 Token Account..."
    spl-token create-account "$MINT_ADDRESS"
    echo ""

    # Mint 测试代币
    echo "Mint 10,000 测试 USDC..."
    spl-token mint "$MINT_ADDRESS" 10000
    echo ""

    # 显示余额
    echo "✓ 完成! 当前 Token 余额:"
    spl-token balance "$MINT_ADDRESS"
    echo ""

    # 保存 Mint Address 到文件
    echo "$MINT_ADDRESS" > .devnet-usdc-mint
    echo "Mint Address 已保存到 .devnet-usdc-mint"
    echo ""

    # 提示更新代码
    echo "==================================="
    echo "下一步: 更新项目配置"
    echo "==================================="
    echo ""
    echo "请编辑 lib/solana/balance.ts:"
    echo ""
    echo "const DEVNET_USDC_MINT = '$MINT_ADDRESS';"
    echo ""
    echo "然后重启开发服务器即可看到余额!"
    echo ""
fi

# 如果要转账到测试钱包
echo "==================================="
echo "转账到测试钱包 (可选)"
echo "==================================="
echo ""

if [ -f .devnet-usdc-mint ]; then
    MINT_ADDRESS=$(cat .devnet-usdc-mint)
    echo "使用保存的 Mint Address: $MINT_ADDRESS"
    echo ""

    read -p "是否转账到测试钱包 AhwkAv13KmHWtsxdfNiaFyoJ4h4kMCA5TtSJLPjFNXqp? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "输入转账数量: " AMOUNT
        echo ""
        echo "转账 $AMOUNT USDC..."

        # 首先为目标地址创建 token account (如果需要)
        spl-token create-account "$MINT_ADDRESS" --owner AhwkAv13KmHWtsxdfNiaFyoJ4h4kMCA5TtSJLPjFNXqp 2>/dev/null || true

        # 转账
        spl-token transfer "$MINT_ADDRESS" "$AMOUNT" AhwkAv13KmHWtsxdfNiaFyoJ4h4kMCA5TtSJLPjFNXqp
        echo ""
        echo "✓ 转账完成!"
    fi
fi

echo ""
echo "==================================="
echo "设置完成!"
echo "==================================="
