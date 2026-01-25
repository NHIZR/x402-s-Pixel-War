# x402 支付功能测试指南

完整的 x402 支付功能测试步骤，帮助你验证昨天完成的区块链支付集成。

---

## 📋 测试前准备

### ✅ 前置条件检查

在开始测试前，确保以下条件都已满足：

- [ ] **Token 已创建**: `BBPTeW3Snc8hJzt2pNdY1VPCDLoGsAGBnxZkfMtjnauG`
- [ ] **Treasury 钱包有 SOL**: `H7yThEThcDYFe7BGx9iHuXs4WMAWB3yux4DL9wGFqqbn`
- [ ] **Token account 已创建并铸造代币**
- [ ] **Faucet 钱包已创建并获得代币**
- [ ] **`.env.local` 已正确配置**
- [ ] **数据库迁移 SQL 已执行**

---

## 🔧 第一步：完成 Token 设置

### 1.1 检查网络连接

```bash
# 测试 Devnet 连接
curl -s -o /dev/null -w "%{http_code}" https://api.devnet.solana.com
# 应该返回: 200 或 405
```

### 1.2 完成 Token 铸造（如果还未完成）

```bash
cd "/Users/lobesterk/Library/Mobile Documents/com~apple~CloudDocs/x402's Pixel War"

# 配置 Solana CLI
solana config set --url https://api.devnet.solana.com
solana config set --keypair wallets/treasury-wallet.json

# 检查余额
solana balance

# 运行自动化脚本
./scripts/create-devnet-token.sh
```

**期望输出**:
```
✅ Token created: BBPTeW3Snc8hJzt2pNdY1VPCDLoGsAGBnxZkfMtjnauG
✅ Token account created
🪙 Minting 1,000,000 tokens to treasury...
✅ Faucet wallet: <FAUCET_ADDRESS>
💰 Transferred 500,000 tokens to faucet
```

### 1.3 配置环境变量

编辑 `.env.local` 文件，添加以下配置：

```bash
# Solana Configuration
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_USDC_MINT_ADDRESS=BBPTeW3Snc8hJzt2pNdY1VPCDLoGsAGBnxZkfMtjnauG
NEXT_PUBLIC_GAME_TREASURY_WALLET=H7yThEThcDYFe7BGx9iHuXs4WMAWB3yux4DL9wGFqqbn

# Faucet Configuration
FAUCET_WALLET_PRIVATE_KEY=<从下面的命令获取>
```

**获取 Faucet 私钥**:
```bash
# 方法 1: 使用 jq 和 base58
cat wallets/faucet-wallet.json | jq -r 'map(tostring) | join(",")' | base58

# 方法 2: 直接读取 JSON 数组（需要在代码中转换）
cat wallets/faucet-wallet.json
```

### 1.4 执行数据库迁移

1. 打开 Supabase Dashboard: https://supabase.com/dashboard
2. 选择你的项目: `xxizahqoxgldrbkuwaxd`
3. 点击左侧 "SQL Editor"
4. 创建新查询
5. 复制 `supabase/migrations/add_transaction_tracking.sql` 的内容
6. 点击 "Run" 执行

**验证迁移成功**:
```sql
-- 检查新字段
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'pixels'
  AND column_name IN ('last_tx_hash', 'last_tx_timestamp', 'tx_count');

-- 检查新表
SELECT * FROM pixel_transactions LIMIT 1;
```

---

## 🧪 第二步：环境测试

### 2.1 启动开发服务器

```bash
cd "/Users/lobesterk/Library/Mobile Documents/com~apple~CloudDocs/x402's Pixel War"
npm run dev
```

**期望输出**:
```
✓ Ready in 2.5s
○ Local:    http://localhost:3000
```

### 2.2 检查控制台错误

打开浏览器访问 http://localhost:3000

**按 F12 打开开发者工具**，检查 Console 是否有错误：

✅ **正常情况**:
- 无红色错误
- 可能有一些警告（正常）

❌ **常见错误**:
- `USDC_MINT_ADDRESS is not configured` → 检查 `.env.local`
- `Failed to fetch RPC` → 检查 Devnet RPC 连接
- `Wallet not connected` → 这是正常的，还没连接钱包

---

## 👛 第三步：钱包准备

### 3.1 安装 Phantom 钱包

1. 访问 https://phantom.app/
2. 点击 "Download" 下载浏览器扩展
3. 安装并创建新钱包（或导入现有钱包）
4. **保存好助记词！**

### 3.2 切换到 Devnet

1. 打开 Phantom 钱包扩展
2. 点击右上角 **⚙️ 设置**
3. 向下滚动找到 **"Developer Settings"**
4. 点击 **"Testnet Mode"** 切换到 ON
5. 在网络选择中选择 **"Devnet"**

**验证**: 钱包界面左上角应显示 "Devnet"

### 3.3 获取 Devnet SOL（用于 gas 费）

1. 复制你的钱包地址（点击地址可以复制）
2. 访问水龙头网站：
   - https://faucet.quicknode.com/solana/devnet
   - 或 https://solfaucet.com/ (选择 Devnet)
3. 粘贴钱包地址，点击 "Send Me SOL"
4. 等待 5-10 秒

**验证**: Phantom 钱包显示约 0.5-1 SOL

---

## 🧪 第四步：功能测试

### 测试 1: 连接钱包 ✅

**步骤**:
1. 刷新游戏页面 (http://localhost:3000)
2. 点击页面右上角的 **"Connect Wallet"** 按钮
3. 在弹出的对话框中选择 **"Phantom"**
4. Phantom 会弹出确认窗口，点击 **"Connect"**

**期望结果**:
- ✅ 按钮文字变为你的钱包地址（缩写形式，如 `AbCd...XyZ`）
- ✅ 右上角显示 **"余额: 0.00 USDC"**（因为还没领取）
- ✅ 出现 **"💧 领取"** 按钮

**截图位置**: 页面右上角

---

### 测试 2: 领取测试 USDC（水龙头功能）✅

**步骤**:
1. 确保钱包已连接
2. 点击右上角的 **"💧 领取"** 按钮
3. 等待处理（可能需要 5-15 秒）

**期望结果**:
- ✅ 显示 Toast 通知："成功领取 100 测试 USDC！"
- ✅ Toast 中包含 **"查看交易 ↗"** 链接
- ✅ 余额更新为 **"余额: 100.00 USDC"**
- ✅ 按钮变为禁用状态或显示倒计时

**点击 "查看交易"**:
- ✅ 跳转到 Solana Explorer
- ✅ 显示 Devnet 交易详情
- ✅ Status: Success (绿色对勾)
- ✅ 可以看到从 Faucet 钱包到你的钱包的转账

**截图**:
1. Toast 通知
2. Solana Explorer 交易页面

---

### 测试 3: 单个像素占领（真实支付）✅

**步骤**:
1. 在画布上随意点击一个**空白像素**（灰色或未占领的）
2. 在弹出的 **PixelInfoModal** 中查看信息
3. 点击 **"占领"** 按钮
4. Phantom 钱包会弹出交易确认
5. 查看交易详情（金额、接收方）
6. 点击 **"Approve"** 批准交易
7. 等待交易确认（5-15 秒）

**期望结果**:
- ✅ Modal 显示价格（如 **"0.10 USDC"**）
- ✅ Phantom 显示交易详情：
  - Amount: 约 0.10 USDC
  - To: `H7yTh...qqbn` (Treasury 钱包)
  - Network Fee: ~0.000005 SOL
- ✅ 交易确认后，像素立即变色
- ✅ 余额扣除（如 100.00 → 99.90）
- ✅ Toast 显示成功消息
- ✅ 像素信息显示你为 owner

**验证交易**:
1. 点击 Toast 中的 "查看交易" 链接
2. 在 Solana Explorer 中验证：
   - ✅ Status: Success
   - ✅ From: 你的钱包
   - ✅ To: Treasury 钱包
   - ✅ Amount: 正确的 USDC 金额
   - ✅ Token: `BBPTe...nauG` (你的 USDC token)

**截图**:
1. PixelInfoModal 显示价格
2. Phantom 交易确认弹窗
3. 像素变色后的画布
4. Solana Explorer 交易详情

---

### 测试 4: 批量像素占领 ✅

**步骤**:
1. 按住鼠标左键，在画布上**拖拽**选择多个像素（如 3x3 区域）
2. 松开鼠标，应该出现批量占领 Modal
3. 查看总价格计算
4. 选择颜色
5. 点击 **"占领所选像素"**
6. Phantom 确认交易
7. 批准交易

**期望结果**:
- ✅ Modal 显示选中的像素数量（如 "已选择 9 个像素"）
- ✅ 显示总价格（如 "总计: 0.90 USDC"）
- ✅ Phantom 显示单笔交易（批量支付）
- ✅ 交易确认后，所有像素同时变色
- ✅ 余额正确扣除（如 99.90 → 99.00）

**注意**: 目前实现是多笔独立交易，每个像素一笔。如果选择 9 个像素，会看到 9 次 Phantom 确认弹窗。

**截图**:
1. 批量选择界面
2. 总价格显示
3. 所有像素变色后

---

### 测试 5: 占领已被占领的像素（价格上涨）✅

**步骤**:
1. 点击一个**已被占领**的像素（有颜色的）
2. 查看价格（应该比基础价格高）
3. 尝试占领

**期望结果**:
- ✅ 价格显示高于基础价格（如 0.15 或 0.20 USDC）
- ✅ 显示当前 owner 信息
- ✅ 显示 "已被占领 X 次"
- ✅ 支付成功后，像素归你所有

**价格计算逻辑**:
```
基础价格 = 0.10 USDC
新价格 = 基础价格 × (1.5 ^ 占领次数)
```

---

### 测试 6: 错误场景测试 ✅

#### 6.1 余额不足

**步骤**:
1. 占领像素直到余额低于 0.10 USDC
2. 尝试再次占领

**期望结果**:
- ✅ 显示错误 Toast: "余额不足，请先领取测试 USDC"
- ✅ 不弹出 Phantom 确认
- ✅ 像素状态不变

#### 6.2 用户取消交易

**步骤**:
1. 点击占领像素
2. Phantom 弹窗出现后，点击 **"Reject"**

**期望结果**:
- ✅ 显示 Toast: "交易已取消"
- ✅ 余额不变
- ✅ 像素状态不变
- ✅ 可以重新尝试

#### 6.3 重复领取水龙头（24小时限制）

**步骤**:
1. 成功领取一次 USDC 后
2. 立即再次点击 "💧 领取" 按钮

**期望结果**:
- ✅ 显示错误: "每个钱包每24小时只能领取一次"
- ✅ HTTP 429 状态码
- ✅ 余额不变

---

### 测试 7: 实时同步测试 ✅

**步骤**:
1. 打开两个浏览器窗口（或使用隐私模式）
2. 在第一个窗口连接钱包 A 并占领一个像素
3. 观察第二个窗口

**期望结果**:
- ✅ 第二个窗口在 1-2 秒内显示像素变化
- ✅ 颜色正确更新
- ✅ Owner 信息正确显示

**进阶测试**（竞态条件）:
1. 两个窗口使用不同钱包
2. 同时尝试占领同一个像素
3. 看哪个交易先确认

**期望结果**:
- ✅ 先确认的交易成功
- ✅ 后确认的交易失败（或者支付更高价格重新占领）

---

### 测试 8: 性能测试 ✅

#### 8.1 页面加载

**测试**:
- 打开 http://localhost:3000
- 观察加载时间

**期望**:
- ✅ 初始加载 < 3 秒
- ✅ 画布渲染 < 1 秒

#### 8.2 交易响应时间

**测试**:
- 从点击 "占领" 到像素变色的时间

**期望**:
- ✅ 用户确认交易后 5-15 秒内完成
- ✅ 显示加载状态（loading spinner）

#### 8.3 余额更新延迟

**测试**:
- 交易完成后余额更新时间

**期望**:
- ✅ 2-3 秒内更新（`useTokenBalance` 每 10 秒轮询一次）

---

## 📊 测试结果记录

创建一个测试记录表：

| 测试项 | 状态 | 备注 | 截图 |
|--------|------|------|------|
| 1. 连接钱包 | ⬜ 待测 / ✅ 通过 / ❌ 失败 | | |
| 2. 领取 USDC | ⬜ 待测 / ✅ 通过 / ❌ 失败 | | |
| 3. 单个像素占领 | ⬜ 待测 / ✅ 通过 / ❌ 失败 | | |
| 4. 批量像素占领 | ⬜ 待测 / ✅ 通过 / ❌ 失败 | | |
| 5. 占领已占领像素 | ⬜ 待测 / ✅ 通过 / ❌ 失败 | | |
| 6.1 余额不足 | ⬜ 待测 / ✅ 通过 / ❌ 失败 | | |
| 6.2 用户取消 | ⬜ 待测 / ✅ 通过 / ❌ 失败 | | |
| 6.3 重复领取 | ⬜ 待测 / ✅ 通过 / ❌ 失败 | | |
| 7. 实时同步 | ⬜ 待测 / ✅ 通过 / ❌ 失败 | | |
| 8. 性能测试 | ⬜ 待测 / ✅ 通过 / ❌ 失败 | | |

---

## 🐛 常见问题排查

### 问题 1: "USDC_MINT_ADDRESS is not configured"

**原因**: `.env.local` 配置缺失

**解决**:
```bash
# 检查 .env.local 是否包含
NEXT_PUBLIC_USDC_MINT_ADDRESS=BBPTeW3Snc8hJzt2pNdY1VPCDLoGsAGBnxZkfMtjnauG

# 重启开发服务器
npm run dev
```

### 问题 2: Phantom 显示 "Insufficient funds"

**原因**: 钱包没有 SOL 支付 gas 费

**解决**:
1. 访问 https://faucet.quicknode.com/solana/devnet
2. 输入钱包地址获取 SOL
3. 等待 5-10 秒
4. 重试交易

### 问题 3: "Transaction simulation failed"

**原因**:
- Token account 未创建
- RPC 连接问题
- 余额不足

**解决**:
```bash
# 手动创建 token account
~/.cargo/bin/spl-token create-account BBPTeW3Snc8hJzt2pNdY1VPCDLoGsAGBnxZkfMtjnauG

# 检查余额
~/.cargo/bin/spl-token balance BBPTeW3Snc8hJzt2pNdY1VPCDLoGsAGBnxZkfMtjnauG
```

### 问题 4: 余额显示一直是 "..."

**原因**: RPC 连接失败或 token mint 地址错误

**解决**:
1. 检查浏览器 Console 错误
2. 验证 `.env.local` 中的 `NEXT_PUBLIC_USDC_MINT_ADDRESS`
3. 检查网络连接到 Devnet

### 问题 5: 水龙头返回 500 错误

**原因**: Faucet 钱包配置问题

**解决**:
```bash
# 检查 faucet 钱包余额
~/.cargo/bin/spl-token balance BBPTeW3Snc8hJzt2pNdY1VPCDLoGsAGBnxZkfMtjnauG \
  --owner wallets/faucet-wallet.json

# 如果余额不足，从 treasury 转入
~/.cargo/bin/spl-token transfer BBPTeW3Snc8hJzt2pNdY1VPCDLoGsAGBnxZkfMtjnauG 100000 \
  $(solana-keygen pubkey wallets/faucet-wallet.json)
```

---

## ✅ 测试完成标准

所有测试通过的标志：

- ✅ 可以连接 Phantom 钱包（Devnet）
- ✅ 可以领取 100 USDC
- ✅ 可以占领单个像素（支付成功）
- ✅ 可以批量占领像素
- ✅ 交易可以在 Solana Explorer 验证
- ✅ 余额正确更新
- ✅ 错误场景正确处理
- ✅ 实时同步正常工作
- ✅ 性能满足要求（<15秒交易确认）

---

## 📸 建议收集的截图/视频

为了记录测试结果，建议收集：

1. **Phantom 钱包切换到 Devnet**（设置界面）
2. **成功领取 USDC 的 Toast 通知**
3. **Solana Explorer 显示水龙头交易**
4. **占领像素时的 Phantom 交易确认弹窗**
5. **像素变色后的画布**
6. **Solana Explorer 显示占领交易详情**
7. **余额变化前后对比**

或者录制一个完整流程的短视频（1-2 分钟）。

---

## 🎯 下一步

测试完成后：

1. 记录所有发现的问题
2. 创建 Bug 报告（如果有）
3. 考虑添加可选功能：
   - 交易历史界面
   - 用户统计面板
   - 排行榜
4. 准备部署到生产环境

---

**祝测试顺利！** 🚀
