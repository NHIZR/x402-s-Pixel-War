# X402 协议测试指南

本指南帮助你安全地测试 X402 支付协议,而不影响现有的游戏系统。

## 📋 概述

你的项目现在支持**两种支付模式**:

| 模式 | 说明 | 默认 |
|------|------|------|
| **Custom SPL Token** | 当前的自定义 USDC Token | ✅ 是 |
| **X402 Protocol v2** | 通过 PayAI Facilitator 的真实支付协议 | ❌ 否 |

通过**功能开关**,你可以随时在两种模式之间切换,而不需要修改代码。

---

## 🎯 快速开始

### 方法 1: 使用环境变量 (推荐)

```bash
# 正常模式 (使用自定义 Token)
npm run dev

# X402 测试模式
NEXT_PUBLIC_ENABLE_X402=true npm run dev
```

### 方法 2: 复制配置文件

```bash
# 切换到 X402 模式
cp .env.x402 .env.local
npm run dev

# 切换回正常模式
git checkout .env.local
npm run dev
```

---

## 🔀 Git 分支管理

### 当前分支

```bash
# 查看当前分支
git branch

# 应该显示:
# * experiment/x402-integration  ← 你在这里
#   main
```

### 切换分支

```bash
# 切换到主分支 (稳定版本)
git checkout main
npm run dev

# 切换回实验分支 (X402 测试)
git checkout experiment/x402-integration
npm run dev
```

### 保存工作进度

```bash
# 提交你的修改
git add .
git commit -m "feat: add X402 payment integration framework"

# 或者临时保存 (不提交)
git stash
git checkout main
# ... 做其他事情 ...
git checkout experiment/x402-integration
git stash pop
```

---

## 🛠️ 文件说明

### 新增的核心文件

| 文件 | 用途 |
|------|------|
| [lib/config/features.ts](../lib/config/features.ts) | 功能开关配置 |
| [lib/services/x402PaymentV2.ts](../lib/services/x402PaymentV2.ts) | X402 协议支付实现 |
| [lib/services/paymentRouter.ts](../lib/services/paymentRouter.ts) | 支付方式路由器 |
| [.env.x402](../.env.x402) | X402 测试环境配置 |

### 现有文件 (未修改)

| 文件 | 状态 |
|------|------|
| [lib/services/x402Payment.ts](../lib/services/x402Payment.ts) | ✅ 保持不变 |
| [lib/services/pixelConquest.ts](../lib/services/pixelConquest.ts) | ✅ 保持不变 |
| [.env.local](../.env.local) | ✅ 保持不变 (默认配置) |

---

## 📝 如何使用新的支付路由

### 旧的方式 (不推荐继续使用)

```typescript
import { useX402Payment } from '@/lib/services/x402Payment';

function MyComponent() {
  const payment = useX402Payment();
  // ...
}
```

### 新的方式 (推荐)

```typescript
import { usePayment } from '@/lib/services/paymentRouter';

function MyComponent() {
  const payment = usePayment();
  // payment 会根据功能开关自动使用正确的实现

  const handlePay = async () => {
    const result = await payment.pay(1.0);
    // ...
  };

  // 调试信息
  console.log('支付协议:', payment.protocol); // 'custom' 或 'x402-v2'
}
```

---

## 🧪 测试步骤

### 第 1 步: 测试当前系统 (确保未破坏)

```bash
# 确保在实验分支
git checkout experiment/x402-integration

# 正常启动 (不启用 X402)
npm run dev
```

访问游戏,测试支付功能:
- ✅ 应该和之前一样正常工作
- ✅ 使用自定义 USDC Token
- ✅ 控制台显示: "💳 Using Custom SPL Token payment"

### 第 2 步: 准备 X402 测试环境

1. **获取 Circle USDC**:
   ```
   访问: https://faucet.circle.com/
   - 选择 "Solana Devnet"
   - 输入你的钱包地址
   - 领取 20 USDC
   ```

2. **确保有 SOL**:
   ```
   访问: https://faucet.solana.com/
   领取 1-2 SOL (用于交易费)
   ```

### 第 3 步: 启用 X402 模式

**注意**: 目前 X402 模式还需要后端 API 支持,暂时无法完整测试。

但你可以看到功能开关生效:

```bash
# 启用 X402
NEXT_PUBLIC_ENABLE_X402=true npm run dev
```

打开浏览器控制台,应该看到:
```
🎯 Feature Flags: { enableX402: true, usdcMint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU' }
💳 Using X402 Protocol v2 payment
```

### 第 4 步: 实现后端 API (下一步)

要让 X402 完整运行,你需要创建后端 API:

```
app/api/x402/conquer-pixel/route.ts
```

参考: `node_modules/x402-solana/README.md` 的 "Server Side" 部分

---

## ⚠️ 重要说明

### 当前状态

| 功能 | 状态 |
|------|------|
| 功能开关框架 | ✅ 已完成 |
| X402 客户端代码 | ✅ 已完成 |
| 支付路由 | ✅ 已完成 |
| 环境配置 | ✅ 已完成 |
| X402 后端 API | ❌ 待实现 |
| 完整测试 | ⏳ 需要后端 API |

### 默认行为

- **默认使用当前系统** - 即使在实验分支上,默认也不会启用 X402
- **需要显式启用** - 必须设置 `NEXT_PUBLIC_ENABLE_X402=true`
- **向后兼容** - 所有现有代码继续正常工作

---

## 🔄 回退到稳定版本

如果测试中遇到任何问题:

```bash
# 方法 1: 切换到主分支
git checkout main
npm run dev

# 方法 2: 禁用 X402 (但留在实验分支)
# 删除 NEXT_PUBLIC_ENABLE_X402 环境变量
npm run dev

# 方法 3: 恢复 .env.local
git checkout .env.local
npm run dev
```

---

## 📚 下一步

1. **实现 X402 后端 API** (参考 x402-solana 文档)
2. **端到端测试** (使用 Circle USDC)
3. **性能对比** (X402 vs 自定义 Token)
4. **决定是否合并到主分支**

---

## 🆘 常见问题

### Q: 如何知道当前用的是哪种支付方式?

打开浏览器控制台,查看:
```
🎯 Feature Flags: { enableX402: true/false, ... }
💳 Using Custom SPL Token payment  或
💳 Using X402 Protocol v2 payment
```

### Q: 我不小心修改了主分支怎么办?

```bash
# 查看当前分支
git branch

# 如果在 main 上,创建备份
git checkout -b backup/accidental-changes

# 回到干净的 main
git checkout main
git reset --hard origin/main
```

### Q: X402 会影响现有功能吗?

不会。默认情况下 X402 是**关闭**的,即使你在实验分支上,不设置 `NEXT_PUBLIC_ENABLE_X402=true` 就不会启用。

---

## 📞 需要帮助?

- 查看 [X402_INTEGRATION_GUIDE.md](./X402_INTEGRATION_GUIDE.md)
- 查看 `node_modules/x402-solana/README.md`
- 或者问我! 😊
