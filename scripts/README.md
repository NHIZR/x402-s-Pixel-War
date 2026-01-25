# 📜 Scripts 目录

项目实用脚本集合。

---

## 🚀 Solana Token 设置

### `complete-token-setup.sh`
**用途**: 网络恢复后完成 Devnet Token 铸造和分发
**执行时间**: ~5 分钟
**前提条件**:
- Treasury 钱包有 SOL
- 网络连接正常

**使用方法**:
```bash
./scripts/complete-token-setup.sh
```

**功能**:
- ✅ 配置 Solana CLI
- ✅ 创建 Token Accounts
- ✅ 铸造 1,000,000 USDC
- ✅ 分发 500,000 到 Faucet
- ✅ 验证余额

---

### `create-devnet-token.sh`
**用途**: 从零开始创建 Devnet Token（包括钱包创建）
**执行时间**: ~10 分钟
**前提条件**:
- 已安装 Solana CLI 和 SPL Token CLI
- 网络连接正常

**使用方法**:
```bash
./scripts/create-devnet-token.sh
```

**功能**:
- ✅ 创建 Treasury 和 Faucet 钱包
- ✅ 空投 SOL（如果水龙头可用）
- ✅ 创建 SPL Token
- ✅ 铸造和分发代币
- ✅ 输出环境变量配置

---

## 🧪 测试脚本

### `check-wallet.ts`
**用途**: 检查 Solana 钱包连接和余额
**使用方法**:
```bash
npx ts-node scripts/check-wallet.ts
```

---

### `test-conquest.ts`
**用途**: 测试像素征服功能
**使用方法**:
```bash
npx ts-node scripts/test-conquest.ts
```

---

## 📝 脚本使用注意事项

### 安全性
- ⚠️ **永远不要** 提交钱包文件到 Git
- ⚠️ **永远不要** 在公共环境运行包含私钥的脚本
- ✅ 确保 `.env.local` 和 `wallets/` 在 `.gitignore` 中

### 网络问题
如果遇到网络连接问题:
1. 查看 [docs/NETWORK_ISSUE_SUMMARY.md](../docs/NETWORK_ISSUE_SUMMARY.md)
2. 确保 VPN/代理已关闭
3. 尝试使用手机热点
4. 等待 Solana 网络恢复

### 权限
确保脚本有执行权限:
```bash
chmod +x scripts/*.sh
```

---

## 🔄 脚本开发流程

添加新脚本时:
1. 添加到对应分类
2. 更新本 README
3. 添加使用示例
4. 注明前提条件

---

**最后更新**: 2026-01-25
