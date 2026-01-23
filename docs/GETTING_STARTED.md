# 快速开始指南 🚀

完整的开发环境设置和测试指南。

## 📋 目录

- [环境要求](#环境要求)
- [钱包设置](#钱包设置)
- [获取测试代币](#获取测试代币)
- [数据库设置](#数据库设置)
- [开发工作流](#开发工作流)
- [常见问题](#常见问题)

---

## 环境要求

### 软件要求

- Node.js 18+
- npm 或 pnpm
- Solana 钱包（Phantom / Solflare）
- Supabase 账号

### 可选工具

- Solana CLI（用于测试代币）
- VSCode + 推荐扩展

---

## 钱包设置

### 1. 安装钱包插件

选择以下任一钱包：

- **Phantom** (推荐): https://phantom.app/
- **Solflare**: https://solflare.com/
- **Torus**: https://toruswallet.io/

### 2. 切换到 Devnet

在钱包设置中：
1. 打开设置/Settings
2. 找到网络/Network 选项
3. 选择 **Devnet** (测试网)

### 3. 复制钱包地址

点击钱包地址可以复制，格式类似：
```
AhwkAv13KmHWtsxdfNiaFyoJ4h4kMCA5TtSJLPjFNXqp
```

### 4. 在线查看钱包

- **Solana Explorer**: https://explorer.solana.com/?cluster=devnet
- **Solscan**: https://solscan.io/?cluster=devnet

---

## 获取测试代币

### 获取 Devnet SOL (手续费)

**方法 1: 官方水龙头**
```bash
# 访问
https://faucet.solana.com/

# 输入钱包地址
# 选择 Devnet
# 点击 Request Airdrop
```

**方法 2: Solana CLI**
```bash
# 安装 Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# 空投 2 SOL
solana airdrop 2 <你的钱包地址> --url devnet
```

### 获取测试 USDC

#### 推荐：创建自己的测试代币

```bash
# 1. 安装 SPL Token CLI
cargo install spl-token-cli

# 2. 创建 Token (6 decimals 像 USDC)
spl-token create-token --decimals 6 --url devnet

# 输出类似：
# Creating token ABC123...
# Address: ABC123xyz...

# 3. 创建 Token Account
spl-token create-account <你的-mint-address> --url devnet

# 4. Mint 测试代币
spl-token mint <你的-mint-address> 10000 --url devnet

# 5. 查看余额
spl-token balance <你的-mint-address> --url devnet
```

#### 更新项目配置

修改 `lib/solana/balance.ts`:

```typescript
// 替换为你的 mint address
const DEVNET_USDC_MINT = '你的-mint-address';
```

### 快速验证

```bash
# 查看 SOL 余额
solana balance <你的地址> --url devnet

# 查看所有 token accounts
spl-token accounts --url devnet

# 使用项目脚本检查
npx tsx scripts/check-wallet.ts <你的钱包地址>
```

---

## 数据库设置

### 1. 执行数据库迁移

详细步骤见 [SETUP_DATABASE.md](SETUP_DATABASE.md)

快速步骤：
1. 打开 Supabase Dashboard → SQL Editor
2. 执行 `supabase/schema.sql`
3. 执行 `supabase/schema-wallet-bridge.sql`
4. 验证函数已创建

### 2. 初始化网格

在 SQL Editor 运行：
```sql
SELECT initialize_grid();
```

### 3. 验证数据

```sql
-- 应该返回 1,500 个像素
SELECT COUNT(*) FROM pixels;

-- 查看前 10 个像素
SELECT * FROM pixels LIMIT 10;
```

---

## 开发工作流

### 启动项目

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 打开浏览器
http://localhost:3000
```

### 连接钱包测试

1. 访问 http://localhost:3000
2. 点击右上角 "Select Wallet"
3. 选择你的钱包（Phantom/Solflare）
4. 批准连接请求
5. 查看控制台日志：
   ```
   钱包连接状态: { connected: true, ... }
   设置钱包地址: AhwkAv13...
   ```

### 测试占领功能

1. 确保有 SOL 余额（手续费）
2. 确保有 USDC 余额（支付）
3. 点击任意像素
4. 选择颜色
5. 点击"占领"
6. 查看 Toast 通知和实时更新

### 开发工具

**浏览器控制台** (F12)
- 查看日志
- 调试错误
- 监控网络请求

**Supabase Dashboard**
- SQL Editor - 运行查询
- Table Editor - 查看数据
- Logs - 查看日志

**Solana Explorer**
- 查看交易
- 验证余额
- 检查 Token Accounts

---

## 调试技巧

### 检查钱包连接

打开浏览器控制台，应该看到：
```javascript
钱包连接状态: { connected: true, publicKey: '...' }
设置钱包地址: AhwkAv13...
```

### 检查余额

```bash
# 使用项目脚本
npx tsx scripts/check-wallet.ts <你的地址>

# 使用 Solana CLI
solana balance <你的地址> --url devnet
spl-token balance --address <token-account> --url devnet
```

### 查看数据库

```sql
-- 查看所有像素
SELECT * FROM pixels ORDER BY y, x;

-- 查看你拥有的像素
SELECT * FROM pixels WHERE wallet_owner = '<你的地址>';

-- 查看最近交易（如果有）
SELECT * FROM transactions ORDER BY created_at DESC LIMIT 10;
```

### 重置网格

```sql
-- 重置所有像素为初始状态
UPDATE pixels
SET
  wallet_owner = NULL,
  color = '#0a0a0a',
  current_price = 0.001,
  conquest_count = 0,
  last_conquered_at = NULL;
```

---

## 常见问题

### Q: 连接钱包后仍显示"游客模式"

**A:** 检查以下几点:
1. 钱包是否解锁
2. 是否批准了连接请求
3. 刷新页面重新连接
4. 查看浏览器控制台错误

### Q: 余额显示 0.00 USDC

**A:** 可能原因:
1. 还没有创建 USDC token account
2. USDC Mint 地址配置不正确
3. 确实余额为 0

检查方法：
```bash
npx tsx scripts/check-wallet.ts <your-address>
```

### Q: 占领按钮不可用

**A:** 检查：
- 是否已连接钱包
- 是否有足够的 USDC 余额
- 是否已经拥有该像素
- 查看 Toast 通知的错误信息

### Q: RPC 连接超时

**A:** 尝试：
1. 使用 VPN
2. 更换 RPC 端点（在 `.env.local` 中）
3. 等待几分钟后重试

```bash
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

### Q: 数据库函数未找到

**A:** 确保执行了数据库迁移：
- `supabase/schema.sql`
- `supabase/schema-wallet-bridge.sql`

验证：
```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE 'conquer%';
```

### Q: 如何切换到主网?

**A:** 修改 `.env.local`:
```bash
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
```

⚠️ **警告**: 主网需要真实的 SOL 和 USDC！

---

## 有用的命令

### 项目管理

```bash
# 安装依赖
npm install

# 开发服务器
npm run dev

# 生产构建
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint

# 测试占领功能
npx tsx scripts/test-conquest.ts
```

### Solana CLI

```bash
# 查看余额
solana balance <address> --url devnet

# 查看 token accounts
spl-token accounts --url devnet

# 查看特定 token 余额
spl-token balance <mint-address> --url devnet

# 空投 SOL
solana airdrop 2 <address> --url devnet

# 转账 token
spl-token transfer <mint-address> <amount> <recipient> --url devnet
```

### 数据库管理

```sql
-- 初始化网格
SELECT initialize_grid();

-- 获取网格状态
SELECT * FROM get_grid_state_wallet();

-- 获取钱包像素
SELECT * FROM get_wallet_pixels('<wallet-address>');

-- 重置像素
UPDATE pixels SET wallet_owner = NULL, color = '#0a0a0a', current_price = 0.001;
```

---

## 推荐工作流

### 首次设置（一次性）

1. ✅ 安装 Solana 钱包插件
2. ✅ 切换到 Devnet
3. ✅ 获取 2-5 SOL（手续费）
4. ✅ 创建测试 USDC Token
5. ✅ Mint 10,000 测试 USDC
6. ✅ 更新项目配置
7. ✅ 执行数据库迁移
8. ✅ 初始化网格

### 日常开发

1. 启动开发服务器
2. 连接钱包
3. 验证余额
4. 开始测试/开发
5. 查看实时更新
6. 检查数据库变化

### 测试流程

1. 单个像素占领测试
2. 批量占领测试
3. 实时同步测试
4. 错误处理测试
5. 边界情况测试

---

## 下一步

- 📖 查看 [黑客松计划](HACKATHON_SPRINT.md) 了解开发路线图
- ⚙️ 查看 [数据库设置](SETUP_DATABASE.md) 了解详细的数据库配置
- ⚡ 查看 [优化总结](OPTIMIZATIONS.md) 了解性能优化

---

**最后更新**: 2026-01-22
