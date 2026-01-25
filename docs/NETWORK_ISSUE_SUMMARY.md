# 网络连接问题总结

**日期**: 2026-01-25
**问题**: 无法连接 Solana Devnet RPC 进行 Token 铸造

---

## 🔍 问题描述

在完成 x402 支付集成代码后，尝试在 Solana Devnet 上铸造 SPL Token 时遇到持续的网络连接问题。

**核心症状**:
- `solana balance` 命令超时
- `curl https://api.devnet.solana.com` 连接超时/被拒绝
- 本地验证器启动失败（Homebrew 安装 bug）

---

## 📊 当前状态

### ✅ 已完成

1. **所有支付代码已实现** (2000+ 行)
   - Faucet API 和 UI
   - 真实 SPL Token 支付集成
   - 数据库交易追踪
   - 完整文档

2. **Token 已创建**
   - Token Mint: `BBPTeW3Snc8hJzt2pNdY1VPCDLoGsAGBnxZkfMtjnauG`
   - Treasury 钱包: `H7yThEThcDYFe7BGx9iHuXs4WMAWB3yux4DL9wGFqqbn`
   - Treasury 余额: 0.5 SOL (在 Devnet)

3. **环境配置**
   - `.env.local` 已配置 Token 地址
   - 测试文档已创建

### ⏳ 待完成（需要网络连接）

1. **创建 Token Account** - 1 分钟
2. **铸造 1,000,000 USDC** - 1 分钟
3. **创建 Faucet 钱包** - 1 分钟
4. **转移 500,000 USDC 到 Faucet** - 2 分钟
5. **配置 Faucet 私钥到 `.env.local`** - 1 分钟

**总计**: 网络恢复后 5-10 分钟即可完成

---

## 🔎 问题诊断过程

### 第1步：发现本地代理

```bash
scutil --proxy | grep Proxy
# 结果: HTTPProxy/HTTPSProxy/SOCKSProxy 都指向 127.0.0.1
```

**初步判断**: 系统代理配置异常

---

### 第2步：发现 VPN 软件运行

```bash
ps aux | grep -i clash
# 发现: FlClash for Dler Cloud 正在运行
```

**操作**: 要求用户关闭 VPN

---

### 第3步：VPN 关闭后仍无法连接

**检查结果**:
- ✅ FlClash 进程已关闭
- ✅ 系统代理已禁用（HTTPEnable=0）
- ✅ 基础网络正常（ping 成功，192ms 延迟）
- ❌ HTTPS 连接超时
- ❌ Solana RPC 连接失败

**DNS 异常**:
```bash
nslookup www.google.com
# 错误: 返回 31.13.112.9 (Facebook IP，不是 Google)
```

---

### 第4步：发现网络路由问题

```bash
netstat -rn | grep default
ifconfig | grep utun
```

**发现**:
- 6个虚拟隧道接口（utun0-5）仍在运行
- VPN 残留的网络配置影响路由

**直接 IP 测试**:
```bash
nslookup api.devnet.solana.com 8.8.8.8
# 正确解析: 199.59.149.202

curl https://199.59.149.202
# 结果: 超时
```

**结论**: 即使 DNS 正确，到 Solana 的连接仍被阻断

---

### 第5步：尝试本地验证器

```bash
solana-test-validator -r
```

**错误**:
```
Error: Failed to create ledger: Archive error: extra entry found: "._genesis.bin"
```

**原因**: Homebrew 安装的已知 bug（macOS 资源分叉文件问题）

---

## 💡 问题根源分析

根据用户判断："应该是需要在本地配置端口才能去访问"

### 最可能的原因

1. **VPN 网络配置残留**
   - FlClash 关闭时未完全清理网络配置
   - utun 接口仍在影响路由表
   - DNS 缓存被污染

2. **防火墙或安全软件**
   - macOS 防火墙可能阻止特定端口
   - 安全软件拦截 Solana 连接

3. **路由表配置**
   - 默认路由指向虚拟接口
   - 需要重置网络配置

4. **ISP/网络环境限制**
   - 某些网络环境阻止特定协议
   - 需要端口转发或特殊配置

---

## ✅ 已尝试的解决方案

| 方案 | 状态 | 结果 |
|------|------|------|
| 关闭系统代理 | ✅ | 无效 |
| 关闭 FlClash VPN | ✅ | 无效 |
| 使用 Google DNS | ✅ | DNS 正常但连接失败 |
| 直接连接 Solana IP | ✅ | 超时 |
| 切换 RPC 端点 | ✅ | 需要 API key 或同样失败 |
| 本地验证器 | ✅ | Homebrew bug |

---

## 🎯 建议的解决方案

### 方案 A：重启网络配置（推荐）

```bash
# 1. 完全退出所有 VPN 软件

# 2. 清除 DNS 缓存（需要密码）
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

# 3. 重启网络接口
sudo ifconfig en0 down
sudo ifconfig en0 up

# 4. 重启 Mac（最彻底）
```

### 方案 B：使用移动热点

- 手机开热点
- Mac 连接手机热点
- 测试 Solana 连接
- **目的**: 排除路由器/ISP 问题

### 方案 C：修复本地验证器

```bash
# 重新安装 Solana CLI (可能修复 Homebrew bug)
brew reinstall solana

# 或从源码编译
cargo install solana-test-validator
```

### 方案 D：晚些时候或明天重试

- 可能只是临时网络问题
- Solana Devnet 可能在维护
- 网络环境可能会好转

---

## 📝 待完成命令（网络恢复后执行）

### 完整脚本

```bash
cd "/Users/lobesterk/Library/Mobile Documents/com~apple~CloudDocs/x402's Pixel War"

# 1. 配置 Solana CLI
solana config set --url devnet
solana config set --keypair wallets/treasury-wallet.json

# 2. 验证余额
solana balance
# 应显示: 0.5 SOL

# 3. 创建 Token Account
~/.cargo/bin/spl-token create-account BBPTeW3Snc8hJzt2pNdY1VPCDLoGsAGBnxZkfMtjnauG

# 4. 铸造 1,000,000 USDC
~/.cargo/bin/spl-token mint BBPTeW3Snc8hJzt2pNdY1VPCDLoGsAGBnxZkfMtjnauG 1000000

# 5. 创建 Faucet 钱包
solana-keygen new --outfile wallets/faucet-wallet.json --no-bip39-passphrase

# 6. 获取 Faucet 地址
FAUCET_ADDR=$(solana-keygen pubkey wallets/faucet-wallet.json)
echo "Faucet 地址: $FAUCET_ADDR"

# 7. 为 Faucet 创建 Token Account
~/.cargo/bin/spl-token create-account BBPTeW3Snc8hJzt2pNdY1VPCDLoGsAGBnxZkfMtjnauG \
  --owner wallets/faucet-wallet.json

# 8. 转移 500,000 USDC 到 Faucet
~/.cargo/bin/spl-token transfer BBPTeW3Snc8hJzt2pNdY1VPCDLoGsAGBnxZkfMtjnauG 500000 $FAUCET_ADDR

# 9. 验证余额
~/.cargo/bin/spl-token balance BBPTeW3Snc8hJzt2pNdY1VPCDLoGsAGBnxZkfMtjnauG
~/.cargo/bin/spl-token balance BBPTeW3Snc8hJzt2pNdY1VPCDLoGsAGBnxZkfMtjnauG --owner wallets/faucet-wallet.json

# 10. 获取 Faucet 私钥 (Base58)
# 需要使用 Node.js 或 Python 转换 JSON 数组
```

### 配置 Faucet 私钥

```bash
# 方法 1: 使用 Node.js
cat > get-faucet-key.js << 'EOF'
const fs = require('fs');
const bs58 = require('bs58');
const keypairBytes = JSON.parse(fs.readFileSync('./wallets/faucet-wallet.json'));
const privateKey = bs58.encode(Buffer.from(keypairBytes));
console.log('FAUCET_WALLET_PRIVATE_KEY=' + privateKey);
EOF

npm install bs58
node get-faucet-key.js

# 复制输出到 .env.local
```

---

## 📊 时间统计

### 已投入时间
- 代码开发: ~8-10 小时
- 网络问题排查: ~2 小时
- **总计**: ~10-12 小时

### 剩余时间（网络恢复后）
- Token 铸造和配置: 5-10 分钟
- 端到端测试: 1-2 小时
- **总计**: ~1.5-2 小时

---

## 🎯 下一步行动

### 立即可做
1. ✅ `.env.local` 已配置
2. ⏳ 执行数据库迁移（Supabase Dashboard）
3. ⏳ 准备 Phantom 钱包

### 网络恢复后
1. 执行上述脚本（5-10 分钟）
2. 完整测试（1-2 小时）
3. 记录测试结果

---

## 📞 技术支持

如果网络问题持续：

1. **检查路由器设置**
   - 端口转发
   - 防火墙规则

2. **联系 ISP**
   - 询问是否阻止加密货币相关连接
   - 请求开放必要端口

3. **使用 VPN 的正确姿势**
   - 在 VPN 软件中添加 Solana 相关域名的直连规则
   - `*.solana.com` 应该直连，不走代理

4. **考虑使用云服务器**
   - 在 AWS/GCP 等云平台创建虚拟机
   - 在云上完成 Token 设置
   - 下载钱包文件到本地

---

**文档创建时间**: 2026-01-25
**状态**: 等待网络恢复
