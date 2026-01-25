# X402 后端 API 说明

## 📋 概述

X402 后端 API 已实现,位于:
```
app/api/x402/conquer-pixel/route.ts
```

这个 API 实现了完整的 x402 v2 协议流程。

---

## 🏗️ 架构

### X402 支付流程

```
1. 客户端发起请求 (无支付)
   ↓
2. 服务端返回 402 Payment Required
   ↓
3. 客户端看到 402,创建支付交易
   ↓
4. 客户端签名交易,添加到 PAYMENT-SIGNATURE header
   ↓
5. 客户端重试请求 (带支付签名)
   ↓
6. 服务端验证支付 (通过 PayAI Facilitator)
   ↓
7. 验证成功 → 服务端返回 200 OK
   ↓
8. 服务端结算支付 (可选)
```

### 使用的包

```typescript
import { X402PaymentHandler } from 'x402-solana/server';
```

- **包名**: `x402-solana` (已安装)
- **版本**: `^2.0.0`
- **用途**: 服务端支付验证和结算

---

## 🔌 API 接口

### GET /api/x402/conquer-pixel

**用途**: 获取 API 信息 (调试用)

**请求**:
```bash
curl http://localhost:3000/api/x402/conquer-pixel
```

**响应**:
```json
{
  "name": "X402 Pixel Conquest API",
  "version": "2.0",
  "protocol": "x402-v2",
  "network": "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
  "treasury": "9GJhxdWqx9RbAGfpwMpzge5tUTBGwbx24NTGEBuuRTbC",
  "status": "ready"
}
```

---

### POST /api/x402/conquer-pixel

**用途**: 处理像素占领支付

#### 第 1 次请求 (无支付)

**请求**:
```bash
curl -X POST http://localhost:3000/api/x402/conquer-pixel \
  -H "Content-Type: application/json" \
  -d '{"amount": 1.0}'
```

**响应**: `402 Payment Required`
```json
{
  "x402Version": 2,
  "resource": {
    "url": "http://localhost:3000/api/x402/conquer-pixel",
    "description": "Pixel Conquest - 1 USDC",
    "mimeType": "application/json"
  },
  "accepts": [
    {
      "scheme": "exact",
      "network": "solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1",
      "amount": "1000000",
      "payTo": "9GJhxdWqx9RbAGfpwMpzge5tUTBGwbx24NTGEBuuRTbC",
      "maxTimeoutSeconds": 300,
      "asset": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
    }
  ],
  "error": "Payment required"
}
```

#### 第 2 次请求 (带支付签名)

**请求**:
```bash
curl -X POST http://localhost:3000/api/x402/conquer-pixel \
  -H "Content-Type: application/json" \
  -H "PAYMENT-SIGNATURE: <base64-encoded-payment-payload>" \
  -d '{"amount": 1.0}'
```

**响应**: `200 OK`
```json
{
  "success": true,
  "message": "Payment received and verified",
  "amount": 1.0,
  "txHash": "..."
}
```

---

## 🧪 测试

### 方法 1: 使用测试脚本

```bash
# 启动开发服务器
npm run dev

# 在另一个终端运行测试
npx tsx scripts/test-x402-api.ts
```

**预期输出**:
```
🧪 Testing X402 API...

📝 Test 1: GET /api/x402/conquer-pixel
✅ Response: {
  "name": "X402 Pixel Conquest API",
  ...
}

📝 Test 2: POST without payment (expect 402)
Status: 402 Payment Required
✅ Correctly returned 402 Payment Required
💡 Payment Requirements:
   - Protocol Version: 2
   - Network: solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1
   - Amount: 1000000
   - PayTo: 9GJhxdWqx9RbAGfpwMpzge5tUTBGwbx24NTGEBuuRTbC
```

### 方法 2: 使用前端测试

```bash
# 启用 X402 模式
NEXT_PUBLIC_ENABLE_X402=true npm run dev

# 访问 http://localhost:3000
# 连接钱包,点击像素
# 查看浏览器控制台的日志
```

**预期日志**:
```
🎯 Feature Flags: { enableX402: true, ... }
💳 Using X402 Protocol v2 payment
🚀 Using X402 Protocol v2 for payment: { ... }
📝 X402 API Request: { ... }
💳 No payment header, sending 402 Payment Required
🔍 Verifying payment with facilitator...
✅ Payment verified successfully
💰 Settling payment with facilitator...
✅ Payment settled successfully
```

---

## 🔧 配置

### 环境变量

确保以下环境变量已配置:

```bash
# .env.local 或 .env.x402

# Treasury 钱包 (接收支付)
NEXT_PUBLIC_GAME_TREASURY_WALLET=9GJhxdWqx9RbAGfpwMpzge5tUTBGwbx24NTGEBuuRTbC

# RPC URL
NEXT_PUBLIC_SOLANA_RPC_URL=https://devnet.helius-rpc.com/?api-key=...

# Base URL (用于 X402 resource 字段)
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# 启用 X402 (前端)
NEXT_PUBLIC_ENABLE_X402=true
```

### X402 Handler 配置

在 [app/api/x402/conquer-pixel/route.ts](../app/api/x402/conquer-pixel/route.ts:11-18):

```typescript
const x402 = new X402PaymentHandler({
  network: 'solana-devnet',              // 自动转换为 CAIP-2
  treasuryAddress: '9GJh...',            // 你的 treasury
  facilitatorUrl: 'https://facilitator.payai.network',
  rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
  defaultDescription: 'Pixel Conquest Payment',
  defaultTimeoutSeconds: 300,            // 5 分钟
});
```

---

## 🔍 调试

### 查看详细日志

后端 API 会打印详细的日志:

```bash
npm run dev
```

查看终端输出:
```
📝 X402 API Request: { amount: 1, recipient: '9GJh...', ... }
💳 No payment header, sending 402 Payment Required
🔍 Verifying payment with facilitator...
✅ Payment verified successfully
💰 Settling payment with facilitator...
✅ Payment settled successfully
```

### 常见错误

**❌ "Treasury wallet not configured"**
- 检查 `NEXT_PUBLIC_GAME_TREASURY_WALLET` 环境变量

**❌ "Facilitator request failed"**
- 检查网络连接
- 确认 facilitator URL: `https://facilitator.payai.network`
- PayAI Facilitator 可能在维护

**❌ "Invalid payment"**
- 支付签名验证失败
- 检查客户端是否正确创建支付
- 查看 `verified.invalidReason` 了解详情

---

## 📊 当前状态

| 组件 | 状态 | 文件 |
|------|------|------|
| X402 客户端 | ✅ 完成 | [lib/services/x402PaymentV2.ts](../lib/services/x402PaymentV2.ts) |
| X402 服务端 | ✅ 完成 | [app/api/x402/conquer-pixel/route.ts](../app/api/x402/conquer-pixel/route.ts) |
| 支付路由 | ✅ 完成 | [lib/services/paymentRouter.ts](../lib/services/paymentRouter.ts) |
| 功能开关 | ✅ 完成 | [lib/config/features.ts](../lib/config/features.ts) |
| 测试脚本 | ✅ 完成 | [scripts/test-x402-api.ts](../scripts/test-x402-api.ts) |

---

## 🚀 下一步

1. **测试 API**:
   ```bash
   npm run dev
   npx tsx scripts/test-x402-api.ts
   ```

2. **获取测试 USDC**:
   - 访问 https://faucet.circle.com/
   - 选择 "Solana Devnet"
   - 领取 20 USDC

3. **端到端测试**:
   ```bash
   NEXT_PUBLIC_ENABLE_X402=true npm run dev
   ```
   - 连接钱包
   - 点击像素
   - 完成支付流程

4. **对比性能**:
   - 自定义 Token vs X402
   - 查看交易费用
   - 测试支付速度

---

## 📚 参考

- [X402_TESTING_GUIDE.md](./X402_TESTING_GUIDE.md) - 完整测试指南
- [X402_INTEGRATION_GUIDE.md](./X402_INTEGRATION_GUIDE.md) - 集成说明
- [x402-solana README](../node_modules/x402-solana/README.md) - 官方文档
- [PayAI Network](https://payai.network) - Facilitator 服务

---

## 💡 提示

- **默认关闭**: X402 默认是关闭的,不会影响现有系统
- **随时切换**: 通过环境变量可以随时在两种模式间切换
- **完整日志**: 开发模式下会打印详细的支付流程日志
- **安全回退**: 如果 X402 有问题,可以立即切回自定义 Token 模式
