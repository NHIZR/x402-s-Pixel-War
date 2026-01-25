# 🛠️ Scripts 脚本工具

项目中使用的实用脚本集合。

---

## 📋 可用脚本

### 区块链相关

#### `create-devnet-token.ts`
创建 Solana Devnet USDC Token 并初始化 Faucet

**使用**：
```bash
npx tsx scripts/create-devnet-token.ts
```

---

#### `setup-treasury.ts`
初始化 Treasury 钱包的 USDC token 账户

**使用**：
```bash
npx tsx scripts/setup-treasury.ts
```

---

#### `check-sol-balance.ts`
检查任意钱包的 SOL 余额

**使用**：
```bash
npx tsx scripts/check-sol-balance.ts <钱包地址>
```

---

#### `setup-faucet.ts`
设置和验证 Faucet 配置

**使用**：
```bash
npx tsx scripts/setup-faucet.ts
```

---

**详细文档**: 参见 [TESTNET_SETUP.md](../docs/TESTNET_SETUP.md)
