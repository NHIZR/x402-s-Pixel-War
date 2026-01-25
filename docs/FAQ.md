# 常见问题 (FAQ)

## 钱包和代币相关

### 为什么 Phantom 钱包显示 "insufficient SOL" 警告，但交易仍然成功？

**问题现象**：
当您第一次领取 USDC 时，Phantom 钱包可能会显示：
```
⚠️ This transaction may fail due to insufficient SOL in your account.
Network Fee: < 0.00001 SOL
Not enough SOL
```

**原因**：
这是 Phantom 钱包预检查的一个**误报**。具体原因如下：

1. **Token 账户创建**：如果您的钱包还没有该 USDC 的 token 账户，Faucet 需要先创建它
2. **账户创建成本**：创建 token 账户需要约 **0.00203928 SOL** 的租金（这不是手续费）
3. **Faucet 支付租金**：我们的 Faucet 代码中，**Faucet 钱包负责支付**创建账户的租金
4. **您只需支付手续费**：您的钱包只需要支付约 **0.00001 SOL** 的交易手续费
5. **Phantom 误判**：Phantom 的预检查可能误以为您需要支付账户创建成本，因此显示警告

**解决方法**：
✅ 安全地点击 **"Confirm anyway"** 按钮，交易会成功！

您只需要钱包中有 **> 0.00001 SOL** 即可（实际上 0.001 SOL 就足够执行约 100 笔交易）。

**代码说明**：
在 `lib/services/faucet.ts` 中，创建 token 账户时：
```typescript
createAssociatedTokenAccountInstruction(
  faucetKeypair.publicKey, // payer (Faucet 支付账户创建租金)
  recipientTokenAccount,    // associated token account
  recipientPublicKey,       // owner (用户拥有账户)
  usdcMintPublicKey        // mint
)
```

`payer` 参数是 `faucetKeypair.publicKey`，表示 Faucet 钱包支付创建费用。

---

### 如何获取测试 SOL？

如果您的钱包 SOL 余额不足：

1. 点击右上角的 **"⚡ 领取 SOL"** 按钮
2. 会跳转到 Solana 官方 Faucet：`https://faucet.solana.com/`
3. 在新页面完成 CAPTCHA 验证
4. 每次可以领取 1-5 SOL（Devnet 测试代币）

---

### USDC 余额为什么是 0？

可能的原因：

1. **还没有领取**：点击 **"💧 领取 USDC"** 按钮领取 100 USDC
2. **Token 账户不存在**：第一次领取会自动创建 token 账户
3. **网络延迟**：等待几秒钟，余额会自动刷新（每 30 秒更新一次）

---

### 为什么有两个余额显示？

之前的版本确实有这个问题（重复显示余额），现在已经修复：

- ✅ 现在只在右上角 **UserInfo 组件** 显示一次 USDC 余额
- ✅ 移除了重复的 FaucetButton 组件

---

## 技术相关

### Faucet 钱包信息

- **公钥地址**: `7g7ceJWE1GuKEsCYA2uiHwncxtHXZUejd1W3cKQiTqnL`
- **当前余额**: 500,000 USDC
- **每次发放**: 100 USDC
- **限制**: 每个钱包每 24 小时可领取一次

### USDC Token 信息

- **Mint 地址**: `GGZQ8ddsdZKh9iEUxMJPKpnYTugLRk3ebs5dw1qWKDTe`
- **Decimals**: 6
- **网络**: Solana Devnet
- **Mint Authority**: `H7yThEThcDYFe7BGx9iHuXs4WMAWB3yux4DL9wGFqqbn`

### RPC 配置

当前使用 **Helius RPC**（更稳定）：
- Devnet: `https://devnet.helius-rpc.com/?api-key=YOUR_API_KEY`
- API Key: 存储在 `.env.local` 的 `HELIUS_API_KEY`

---

## 开发相关

### 如何检查钱包余额？

使用提供的脚本：

```bash
# 检查 SOL 余额
npx tsx scripts/check-sol-balance.ts <钱包地址>

# 检查 Faucet 钱包
npx tsx scripts/check-sol-balance.ts 7g7ceJWE1GuKEsCYA2uiHwncxtHXZUejd1W3cKQiTqnL
```

### 如何设置 Faucet？

详见 [docs/SETUP_FAUCET.md](./SETUP_FAUCET.md)

主要步骤：
1. 给 Faucet 钱包充值 SOL
2. 运行 `npx tsx scripts/create-devnet-token.ts`
3. 验证设置成功

### 如何铸造更多 USDC？

如果 Faucet 余额不足，且您有 mint authority：

```bash
# 使用 Solana CLI
spl-token mint <MINT_ADDRESS> <AMOUNT> --owner faucet-wallet.json
```

---

## 错误排查

### "Faucet token account not found or not initialized"

**原因**: Faucet 钱包还没有创建 USDC token 账户

**解决**:
```bash
npx tsx scripts/setup-faucet.ts
```

### "Rate limit exceeded"

**原因**: 24 小时内已经领取过

**解决**: 等待 24 小时后再次领取

### 网络连接超时

**原因**: RPC 端点响应慢或不可用

**解决**:
1. 检查 `.env.local` 中的 `NEXT_PUBLIC_SOLANA_RPC_URL`
2. 尝试使用 Helius RPC（已配置）
3. 或使用其他公共 RPC 端点

---

## 联系和反馈

如有其他问题，请：
- 查看代码注释
- 查看 [文档目录](./README.md)
- 提交 Issue
