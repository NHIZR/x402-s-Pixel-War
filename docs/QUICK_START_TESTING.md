# 🚀 快速开始测试 x402 支付功能

**5 分钟快速设置 + 立即开始测试**

---

## ⚡ 第一步：完成 Token 设置（5-10 分钟）

### 选项 A: 自动化脚本（推荐）

```bash
cd "/Users/lobesterk/Library/Mobile Documents/com~apple~CloudDocs/x402's Pixel War"

# 确保网络连接正常
curl -I https://api.devnet.solana.com

# 运行自动化脚本
./scripts/create-devnet-token.sh
```

**成功后会输出环境变量**，复制它们。

---

### 选项 B: 手动执行（如果脚本失败）

```bash
cd "/Users/lobesterk/Library/Mobile Documents/com~apple~CloudDocs/x402's Pixel War"

# 1. 配置 Solana CLI
solana config set --url https://api.devnet.solana.com
solana config set --keypair wallets/treasury-wallet.json

# 2. 检查余额
solana balance
# 应该显示: 0.5 SOL

# 3. 为 Token 创建 account
~/.cargo/bin/spl-token create-account BBPTeW3Snc8hJzt2pNdY1VPCDLoGsAGBnxZkfMtjnauG

# 4. 铸造 1,000,000 USDC
~/.cargo/bin/spl-token mint BBPTeW3Snc8hJzt2pNdY1VPCDLoGsAGBnxZkfMtjnauG 1000000

# 5. 创建 Faucet 钱包
solana-keygen new --outfile wallets/faucet-wallet.json --no-bip39-passphrase

# 6. 获取 Faucet 地址
FAUCET_ADDR=$(solana-keygen pubkey wallets/faucet-wallet.json)
echo "Faucet Address: $FAUCET_ADDR"

# 7. 为 Faucet 创建 token account
~/.cargo/bin/spl-token create-account BBPTeW3Snc8hJzt2pNdY1VPCDLoGsAGBnxZkfMtjnauG \
  --owner wallets/faucet-wallet.json

# 8. 转移 500,000 USDC 到 Faucet
~/.cargo/bin/spl-token transfer BBPTeW3Snc8hJzt2pNdY1VPCDLoGsAGBnxZkfMtjnauG 500000 $FAUCET_ADDR

# 9. 验证余额
~/.cargo/bin/spl-token balance BBPTeW3Snc8hJzt2pNdY1VPCDLoGsAGBnxZkfMtjnauG
# 应该显示: 500000

~/.cargo/bin/spl-token balance BBPTeW3Snc8hJzt2pNdY1VPCDLoGsAGBnxZkfMtjnauG \
  --owner wallets/faucet-wallet.json
# 应该显示: 500000
```

---

## ⚡ 第二步：配置环境变量（2 分钟）

编辑 `.env.local` 文件，添加以下配置：

```bash
# Supabase Configuration (保持不变)
NEXT_PUBLIC_SUPABASE_URL=https://xxizahqoxgldrbkuwaxd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4aXphaHFveGdsZHJia3V3YXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5OTE1NDYsImV4cCI6MjA4NDU2NzU0Nn0.q1EE--Wr2foYukZaexDfyf8oFn-UqeVY2CU-PRwApc4

# Solana Configuration
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_USDC_MINT_ADDRESS=BBPTeW3Snc8hJzt2pNdY1VPCDLoGsAGBnxZkfMtjnauG
NEXT_PUBLIC_GAME_TREASURY_WALLET=H7yThEThcDYFe7BGx9iHuXs4WMAWB3yux4DL9wGFqqbn

# Faucet Configuration
FAUCET_WALLET_PRIVATE_KEY=<需要获取>
```

### 获取 `FAUCET_WALLET_PRIVATE_KEY`

**重要**: 需要将 JSON 数组转换为 Base58 字符串。

#### 方法 1: 使用 Node.js 脚本（推荐）

创建临时脚本 `get-faucet-key.js`:

```javascript
const fs = require('fs');
const bs58 = require('bs58');

const keyfile = './wallets/faucet-wallet.json';
const keypairBytes = JSON.parse(fs.readFileSync(keyfile));
const privateKey = bs58.encode(Buffer.from(keypairBytes));

console.log('FAUCET_WALLET_PRIVATE_KEY=' + privateKey);
```

运行：
```bash
npm install bs58
node get-faucet-key.js
```

复制输出的值到 `.env.local`。

#### 方法 2: 手动使用 Python

```bash
python3 -c "
import json
import base58
with open('wallets/faucet-wallet.json') as f:
    keypair = json.load(f)
print('FAUCET_WALLET_PRIVATE_KEY=' + base58.b58encode(bytes(keypair)).decode())
"
```

#### 方法 3: 查看 JSON 并在代码中处理

如果上面的方法都不行，可以直接复制 JSON 数组到 `.env.local`，然后修改代码来处理：

```bash
# 查看 faucet wallet JSON
cat wallets/faucet-wallet.json

# 复制整个数组，如: [123,45,67,...]
```

然后修改 `lib/services/faucet.ts` 来处理 JSON 格式的私钥。

---

## ⚡ 第三步：执行数据库迁移（3 分钟）

1. **打开 Supabase Dashboard**
   - 访问: https://supabase.com/dashboard/project/xxizahqoxgldrbkuwaxd

2. **进入 SQL Editor**
   - 左侧菜单点击 "SQL Editor"
   - 点击 "New Query"

3. **复制并执行 SQL**
   - 打开 `supabase/migrations/add_transaction_tracking.sql`
   - 复制全部内容
   - 粘贴到 SQL Editor
   - 点击 "Run" 按钮

4. **验证成功**
   ```sql
   -- 在 SQL Editor 中运行
   SELECT column_name FROM information_schema.columns
   WHERE table_name = 'pixels'
   AND column_name IN ('last_tx_hash', 'last_tx_timestamp', 'tx_count');

   -- 应该返回 3 行
   ```

---

## ⚡ 第四步：启动开发服务器（1 分钟）

```bash
cd "/Users/lobesterk/Library/Mobile Documents/com~apple~CloudDocs/x402's Pixel War"
npm run dev
```

访问: http://localhost:3000

---

## ⚡ 第五步：准备 Phantom 钱包（5 分钟）

### 1. 安装 Phantom

- 访问: https://phantom.app/
- 下载浏览器扩展
- 创建新钱包（保存助记词！）

### 2. 切换到 Devnet

1. 打开 Phantom 扩展
2. 点击 ⚙️ 设置
3. 找到 "Developer Settings"
4. 开启 "Testnet Mode"
5. 选择网络: **Devnet**

### 3. 获取 Devnet SOL

- 复制钱包地址
- 访问: https://faucet.quicknode.com/solana/devnet
- 粘贴地址，点击 "Send Me SOL"
- 等待 5-10 秒

**验证**: Phantom 显示约 0.5-1 SOL

---

## 🧪 开始测试！

现在你可以开始测试了。按照以下顺序：

### ✅ 测试清单（5 分钟快速验证）

1. **连接钱包**
   - [ ] 访问 http://localhost:3000
   - [ ] 点击 "Connect Wallet"
   - [ ] 选择 Phantom
   - [ ] 确认连接

2. **领取 USDC**
   - [ ] 点击 "💧 领取"
   - [ ] 等待交易确认
   - [ ] 验证余额变为 100 USDC
   - [ ] 点击 "查看交易" 链接

3. **占领像素**
   - [ ] 点击一个空白像素
   - [ ] 查看价格（应显示 "X USDC"）
   - [ ] 点击 "占领"
   - [ ] Phantom 弹窗确认交易
   - [ ] 等待像素变色
   - [ ] 验证余额扣除

4. **验证交易**
   - [ ] 在 Solana Explorer 查看交易
   - [ ] Status: Success ✅
   - [ ] 确认金额正确

---

## 📋 详细测试

完成快速验证后，查看完整测试指南：

👉 [docs/TESTING_GUIDE.md](./TESTING_GUIDE.md)

包含：
- 批量占领测试
- 错误场景测试
- 实时同步测试
- 性能测试
- 问题排查指南

---

## ⚠️ 常见问题快速修复

### 问题: "USDC_MINT_ADDRESS is not configured"

```bash
# 检查 .env.local
cat .env.local | grep USDC_MINT

# 应该看到:
# NEXT_PUBLIC_USDC_MINT_ADDRESS=BBPTeW3Snc8hJzt2pNdY1VPCDLoGsAGBnxZkfMtjnauG
```

### 问题: Phantom 说 "Insufficient funds"

```bash
# 获取更多 Devnet SOL
# 访问: https://faucet.quicknode.com/solana/devnet
```

### 问题: 水龙头返回 500 错误

```bash
# 检查 Faucet 余额
~/.cargo/bin/spl-token balance BBPTeW3Snc8hJzt2pNdY1VPCDLoGsAGBnxZkfMtjnauG \
  --owner wallets/faucet-wallet.json

# 如果不足，从 treasury 转入
~/.cargo/bin/spl-token transfer BBPTeW3Snc8hJzt2pNdY1VPCDLoGsAGBnxZkfMtjnauG 100000 \
  $(solana-keygen pubkey wallets/faucet-wallet.json)
```

### 问题: 余额一直显示 "..."

- 检查浏览器 Console (F12)
- 验证 `.env.local` 中的配置
- 检查 Devnet RPC 连接

---

## ✅ 成功标志

测试成功的标志：

- ✅ 可以连接 Phantom 钱包
- ✅ 可以领取 100 USDC
- ✅ 可以占领像素（真实支付）
- ✅ 交易可以在 Solana Explorer 验证
- ✅ 余额正确更新

**完成后截图/录屏**，记录测试结果！🎉

---

## 📞 需要帮助？

如果遇到问题：

1. 查看 [TESTING_GUIDE.md](./TESTING_GUIDE.md) 的故障排查部分
2. 检查浏览器 Console 错误信息
3. 查看 Solana Explorer 交易详情
4. 检查 `.env.local` 配置是否完整

**祝测试顺利！** 🚀
