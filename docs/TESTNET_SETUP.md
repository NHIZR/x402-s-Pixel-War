# Testnet 设置指南

完整的 Solana Testnet 代币创建和配置指南，适用于 x402's Pixel War 项目。

---

## 目录

- [概述](#概述)
- [前置要求](#前置要求)
- [第一部分：创建 Testnet 代币](#第一部分创建-testnet-代币)
- [第二部分：配置环境变量](#第二部分配置环境变量)
- [第三部分：部署和测试](#第三部分部署和测试)
- [故障排除](#故障排除)
- [常见问题](#常见问题)

---

## 概述

本指南将帮助您在 Solana Testnet 上创建自定义 USDC 测试代币，并配置游戏使用这些代币进行支付。

### 为什么使用 Testnet？

- **真实区块链体验**: 所有交易都在真实的 Solana 区块链上（Testnet）
- **零成本**: 使用免费的测试代币，无需真实资金
- **可验证**: 可以在 Solana Explorer 上查看所有交易
- **安全演示**: 适合演示、开发和学习，不会有资金损失风险

### x402 vs USDC

在开始之前，理解这两个概念很重要：

| 概念 | 类型 | 说明 |
|------|------|------|
| **x402** | 支付协议 | 定义了如何进行支付交易的规范和标准 |
| **USDC** | 支付代币 | 实际用于支付的稳定币（本项目中是测试代币） |

**类比**: x402 就像 HTTP 协议，USDC 就像网页内容。

---

## 前置要求

### 1. 安装 Solana CLI

```bash
# macOS 和 Linux
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# 验证安装
solana --version
# 应该显示: solana-cli 1.18.0 或更高版本
```

**Windows 用户**: 请参考 [Solana 官方文档](https://docs.solana.com/cli/install-solana-cli-tools)

### 2. 安装 SPL Token CLI

```bash
cargo install spl-token-cli

# 验证安装
spl-token --version
```

### 3. 配置 Solana CLI 到 Testnet

```bash
# 设置网络为 Testnet
solana config set --url https://api.testnet.solana.com

# 验证配置
solana config get
# 应该显示: RPC URL: https://api.testnet.solana.com
```

### 4. 获取测试 SOL

测试 SOL 用于支付交易的 gas 费用。

```bash
# 创建或使用现有钱包
solana-keygen new --outfile ~/.config/solana/id.json

# 获取钱包地址
solana address

# 从水龙头获取测试 SOL（每次 2 SOL）
solana airdrop 2

# 验证余额
solana balance
```

**注意**: 如果 airdrop 失败，可以访问 https://faucet.solana.com/ 手动请求。

---

## 第一部分：创建 Testnet 代币

### 步骤 1: 创建项目钱包

我们需要创建两个钱包：

1. **Treasury Wallet** (金库钱包): 接收平台收益
2. **Faucet Wallet** (水龙头钱包): 用于分发测试代币给用户

```bash
# 创建项目根目录下的 wallets 文件夹
cd "/Users/lobesterk/Library/Mobile Documents/com~apple~CloudDocs/x402's Pixel War"
mkdir -p wallets

# 创建 Treasury 钱包
solana-keygen new --outfile wallets/treasury-keypair.json --no-bip39-passphrase
# 记录显示的公钥地址（Treasury Address）

# 创建 Faucet 钱包
solana-keygen new --outfile wallets/faucet-keypair.json --no-bip39-passphrase
# 记录显示的公钥地址（Faucet Address）

# 为两个钱包充值测试 SOL
solana airdrop 2 $(solana-keygen pubkey wallets/treasury-keypair.json)
solana airdrop 2 $(solana-keygen pubkey wallets/faucet-keypair.json)
```

**安全提示**:
- 这些钱包仅用于 Testnet，不要在 Mainnet 上使用
- 将 `wallets/` 目录添加到 `.gitignore`，不要提交到 Git

### 步骤 2: 创建 USDC 代币

```bash
# 使用 Faucet 钱包创建代币
spl-token create-token --decimals 6 wallets/faucet-keypair.json

# 这会输出代币地址，例如：
# Creating token ABC123xyz...
# Address: ABC123xyz...
# 记录这个地址（Token Mint Address）
```

**重要参数说明**:
- `--decimals 6`: USDC 使用 6 位小数（1 USDC = 1,000,000 最小单位）

### 步骤 3: 创建代币账户

为 Faucet 钱包创建代币账户（用于存储代币）：

```bash
# 创建 Faucet 的代币账户
spl-token create-account <YOUR_TOKEN_MINT_ADDRESS> --owner wallets/faucet-keypair.json

# 输出示例：
# Creating account XYZ789...
# 记录这个账户地址（Faucet Token Account）
```

### 步骤 4: 铸造初始代币供应

为了给用户提供测试代币，我们需要铸造足够的供应量：

```bash
# 铸造 1,000,000 USDC 到 Faucet 钱包
spl-token mint <YOUR_TOKEN_MINT_ADDRESS> 1000000 <FAUCET_TOKEN_ACCOUNT> --owner wallets/faucet-keypair.json

# 验证余额
spl-token balance <YOUR_TOKEN_MINT_ADDRESS> --owner wallets/faucet-keypair.json
# 应该显示: 1000000
```

**供应量建议**:
- 小型测试: 10,000 USDC
- 演示/Hackathon: 100,000 USDC
- 长期运行: 1,000,000 USDC

### 步骤 5: 配置代币元数据（可选）

使用 Metaplex 添加代币名称、符号和图标：

```bash
# 安装 Metaplex Sugar CLI（用于元数据）
# 这一步是可选的，但可以让代币在钱包中显示更友好

# 创建元数据 JSON 文件
cat > token-metadata.json << EOF
{
  "name": "x402 Test USDC",
  "symbol": "x402-USDC",
  "description": "Test USDC token for x402's Pixel War on Solana Testnet",
  "image": "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png"
}
EOF
```

**注意**: 元数据配置需要额外的工具，可以暂时跳过，不影响代币功能。

---

## 第二部分：配置环境变量

### 步骤 1: 更新 `.env.local`

在项目根目录创建或更新 `.env.local` 文件：

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Solana Testnet Configuration
NEXT_PUBLIC_SOLANA_NETWORK=testnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.testnet.solana.com
NEXT_PUBLIC_USDC_MINT_ADDRESS=<YOUR_TOKEN_MINT_ADDRESS>
NEXT_PUBLIC_FAUCET_WALLET=<YOUR_FAUCET_PUBLIC_KEY>

# Server-side wallet paths (绝对路径)
TREASURY_WALLET_PATH=/absolute/path/to/wallets/treasury-keypair.json
FAUCET_WALLET_PATH=/absolute/path/to/wallets/faucet-keypair.json
```

**替换占位符**:
- `<YOUR_TOKEN_MINT_ADDRESS>`: 步骤 2 中创建的代币地址
- `<YOUR_FAUCET_PUBLIC_KEY>`: Faucet 钱包的公钥地址
- 钱包路径使用绝对路径，例如: `/Users/yourname/project/wallets/treasury-keypair.json`

### 步骤 2: 验证配置

```bash
# 检查 Faucet 钱包余额
spl-token balance <YOUR_TOKEN_MINT_ADDRESS> --owner wallets/faucet-keypair.json

# 检查钱包 SOL 余额（用于 gas）
solana balance $(solana-keygen pubkey wallets/faucet-keypair.json)
solana balance $(solana-keygen pubkey wallets/treasury-keypair.json)
```

**重要**:
- Faucet 钱包应该有足够的 USDC 余额（用于分发）
- 两个钱包都应该有至少 0.5 SOL（用于 gas 费用）

### 步骤 3: 更新 `.env.local.example`

确保示例文件包含所有必要变量（供其他开发者参考）：

```bash
# .env.local.example
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SOLANA_NETWORK=testnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.testnet.solana.com
NEXT_PUBLIC_USDC_MINT_ADDRESS=your_token_mint_address
NEXT_PUBLIC_FAUCET_WALLET=your_faucet_wallet_address
TREASURY_WALLET_PATH=/path/to/treasury-keypair.json
FAUCET_WALLET_PATH=/path/to/faucet-keypair.json
```

---

## 第三部分：部署和测试

### 步骤 1: 本地测试

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000 并测试：

1. 连接钱包（确保钱包切换到 Testnet）
2. 点击 "获取测试 USDC" 按钮
3. 等待交易确认
4. 验证钱包中收到 100 USDC

### 步骤 2: 验证交易

在 Solana Explorer 上验证交易：

1. 访问 https://explorer.solana.com/?cluster=testnet
2. 搜索您的钱包地址或交易签名
3. 查看交易详情和代币转账记录

### 步骤 3: 测试像素占领

1. 确保钱包有测试 USDC 和 SOL
2. 点击像素网格上的任意像素
3. 选择颜色并点击 "占领"
4. 批准交易并等待确认
5. 验证像素颜色改变和所有权更新

---

## 故障排除

### 问题 1: "Airdrop failed"

**原因**: Testnet 水龙头速率限制

**解决方案**:
```bash
# 方法 1: 等待几分钟后重试
solana airdrop 2

# 方法 2: 使用网页水龙头
# 访问 https://faucet.solana.com/
# 输入钱包地址并请求 SOL
```

### 问题 2: "Insufficient funds"

**原因**: 钱包 SOL 余额不足以支付 gas 费

**解决方案**:
```bash
# 检查余额
solana balance <WALLET_ADDRESS>

# 如果余额低于 0.01 SOL，请求更多
solana airdrop 2 <WALLET_ADDRESS>
```

### 问题 3: "Token account not found"

**原因**: 用户钱包没有该代币的 Associated Token Account

**解决方案**:
这个问题应该由代码自动处理（创建 ATA），但如果手动测试：

```bash
# 为用户钱包创建代币账户
spl-token create-account <TOKEN_MINT_ADDRESS> --owner <USER_WALLET_ADDRESS>
```

### 问题 4: "Transaction simulation failed"

**原因**: 多种可能，需要查看详细错误

**解决方案**:
```bash
# 启用详细日志查看具体错误
export RUST_LOG=solana_runtime::system_instruction_processor=trace

# 或在浏览器控制台查看完整错误消息
```

### 问题 5: Faucet 余额不足

**原因**: 已分发太多代币，Faucet 余额耗尽

**解决方案**:
```bash
# 铸造更多代币到 Faucet
spl-token mint <TOKEN_MINT_ADDRESS> 100000 <FAUCET_TOKEN_ACCOUNT> --owner wallets/faucet-keypair.json

# 验证新余额
spl-token balance <TOKEN_MINT_ADDRESS> --owner wallets/faucet-keypair.json
```

---

## 常见问题

### Q1: 我可以在 Mainnet 上使用相同的代币吗？

**A**: 不可以。Testnet 和 Mainnet 是完全独立的网络。如果要在 Mainnet 上运行，需要：
1. 使用真实的 USDC（地址: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`）
2. 购买真实的 SOL 和 USDC
3. 更新环境变量中的网络配置

**警告**: Mainnet 使用真实资金，确保充分测试后再部署。

### Q2: 测试 USDC 有真实价值吗？

**A**: 没有。Testnet 上的所有代币（包括 SOL 和自定义 USDC）都是测试代币，没有任何真实价值。它们仅用于开发和测试目的。

### Q3: 每个用户每 24 小时只能领取一次吗？

**A**: 是的。水龙头 API 通过检查钱包地址和时间戳来限制每个钱包每 24 小时只能领取 100 USDC。这是为了防止滥用和确保公平分配。

### Q4: 我可以修改水龙头限额吗？

**A**: 可以。在 `app/api/faucet/route.ts` 中修改以下常量：

```typescript
const FAUCET_AMOUNT = 100; // 每次领取数量
const COOLDOWN_HOURS = 24; // 冷却时间（小时）
```

### Q5: 如何查看所有交易记录？

**A**: 有几种方法：

1. **Solana Explorer**:
   - 访问 https://explorer.solana.com/?cluster=testnet
   - 搜索钱包地址或代币地址

2. **使用 CLI**:
   ```bash
   solana transaction-history <WALLET_ADDRESS> --limit 10
   ```

3. **在应用中**:
   - 查看浏览器控制台的交易日志
   - 未来会添加交易历史面板

### Q6: 代币可以转移到其他钱包吗？

**A**: 可以。这是标准的 SPL Token，支持所有标准操作：

```bash
# 转移代币
spl-token transfer <TOKEN_MINT_ADDRESS> <AMOUNT> <RECIPIENT_ADDRESS> --owner wallets/faucet-keypair.json

# 例如：转移 50 USDC
spl-token transfer ABC123xyz... 50 RecipientAddress123... --owner wallets/faucet-keypair.json
```

### Q7: 如何重置整个 Testnet 设置？

**A**: 如果需要从头开始：

```bash
# 1. 删除现有钱包
rm -rf wallets/

# 2. 重新运行本指南的所有步骤
# 从"创建项目钱包"开始

# 3. 更新环境变量中的新地址
```

### Q8: 为什么选择 Testnet 而不是 Devnet？

**A**: 两个网络的对比：

| 特性 | Testnet | Devnet |
|------|---------|--------|
| 稳定性 | 更稳定 | 频繁重置 |
| 性能 | 接近 Mainnet | 可能不稳定 |
| 用途 | 演示、测试 | 快速开发 |
| 推荐场景 | 公开演示、Hackathon | 早期开发 |

Testnet 更适合需要稳定性的演示和长期测试。

---

## 安全最佳实践

### 1. 钱包安全

- ✅ 将 `wallets/` 添加到 `.gitignore`
- ✅ 不要将钱包文件提交到 Git
- ✅ 使用环境变量存储钱包路径
- ✅ 仅在服务器端使用私钥
- ✅ Testnet 和 Mainnet 使用不同的钱包

### 2. 环境变量安全

- ✅ 不要在客户端暴露私钥
- ✅ 使用 `NEXT_PUBLIC_` 前缀区分客户端/服务器变量
- ✅ 在 Vercel 等平台使用加密的环境变量存储
- ✅ 定期轮换 API 密钥和敏感凭证

### 3. 代码安全

- ✅ 验证所有用户输入
- ✅ 使用交易签名验证所有权
- ✅ 实施速率限制（水龙头）
- ✅ 记录所有重要操作的日志

### 4. 部署安全

- ✅ 在部署到生产环境前充分测试
- ✅ 使用 Vercel 环境变量而不是硬编码
- ✅ 启用 HTTPS（Vercel 自动提供）
- ✅ 定期备份数据库和关键数据

---

## 下一步

完成 Testnet 设置后，您可以：

1. **部署到 Vercel**: 查看 [部署指南](DEPLOYMENT.md)
2. **测试游戏功能**: 查看 [用户手册](USER_GUIDE.md)
3. **了解 API**: 查看 [API 文档](API.md)
4. **理解架构**: 查看 [架构设计](ARCHITECTURE.md)

---

## 相关资源

### Solana 官方文档
- [Solana CLI 安装](https://docs.solana.com/cli/install-solana-cli-tools)
- [SPL Token 程序](https://spl.solana.com/token)
- [Testnet 水龙头](https://faucet.solana.com/)

### 工具和浏览器
- [Solana Explorer (Testnet)](https://explorer.solana.com/?cluster=testnet)
- [Solscan (Testnet)](https://solscan.io/?cluster=testnet)
- [Phantom 钱包](https://phantom.app/)
- [Solflare 钱包](https://solflare.com/)

### x402 项目文档
- [README](../README.md) - 项目概述
- [部署指南](DEPLOYMENT.md) - Vercel 部署
- [数据库设置](SETUP_DATABASE.md) - Supabase 配置

---

**最后更新**: 2026-01-24
**版本**: v1.0

如有问题或需要帮助，请参考上述文档或在项目中创建 Issue。
