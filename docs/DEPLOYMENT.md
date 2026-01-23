# 部署指南

完整的生产环境部署指南，涵盖 Vercel、Supabase 和 Solana 配置。

---

## 📚 目录

- [概览](#概览)
- [前置要求](#前置要求)
- [Supabase 配置](#supabase-配置)
- [Vercel 部署](#vercel-部署)
- [环境变量配置](#环境变量配置)
- [Solana 网络配置](#solana-网络配置)
- [部署后验证](#部署后验证)
- [故障排除](#故障排除)
- [性能优化](#性能优化)
- [监控和日志](#监控和日志)

---

## 概览

x402's Pixel War 使用以下技术栈部署：

| 组件 | 服务 | 说明 |
|------|------|------|
| **前端** | Vercel | Next.js 应用托管 |
| **数据库** | Supabase | PostgreSQL + Realtime |
| **区块链** | Solana | Devnet/Mainnet |
| **支付** | x402 (Mock) | USDC 支付协议 |

**部署时间**: 约 15-30 分钟

---

## 前置要求

### 必需账号

1. **Vercel 账号**: https://vercel.com/signup
2. **Supabase 账号**: https://supabase.com/dashboard
3. **GitHub 账号**: 用于连接 Vercel

### 本地工具

```bash
# Node.js 18+ 和 npm
node --version  # v18.0.0+
npm --version   # v9.0.0+

# Git
git --version

# Vercel CLI (可选)
npm install -g vercel
```

---

## Supabase 配置

### 1. 创建项目

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 点击 "New Project"
3. 填写项目信息:
   - **Name**: `x402-pixel-war`
   - **Database Password**: 生成强密码（保存好）
   - **Region**: 选择离用户最近的区域（如 `ap-southeast-1` 新加坡）
4. 点击 "Create new project"
5. 等待项目创建（约 2-3 分钟）

### 2. 执行数据库迁移

**步骤 1: 打开 SQL Editor**
- 在 Supabase Dashboard 左侧菜单点击 "SQL Editor"

**步骤 2: 执行迁移脚本**

按顺序执行以下脚本：

#### a) 基础架构
```sql
-- 复制 supabase/schema-wallet-bridge.sql 的完整内容
-- 粘贴到 SQL Editor 并点击 "Run"
```

#### b) 批量占领优化
```sql
-- 复制 supabase/optimizations-batch-conquest.sql 的完整内容
-- 粘贴到 SQL Editor 并点击 "Run"
```

**步骤 3: 验证迁移**

```sql
-- 检查表是否创建
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'pixels';

-- 检查像素数量（应该是 1500）
SELECT COUNT(*) FROM pixels;

-- 检查函数是否存在
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'conquer_pixel_wallet',
    'conquer_pixels_batch',
    'recolor_pixel_wallet',
    'recolor_pixels_batch',
    'get_grid_state_wallet',
    'get_wallet_pixels'
  );
```

应该看到 6 个函数。

### 3. 启用 Realtime

```sql
-- 将 pixels 表添加到实时发布
ALTER PUBLICATION supabase_realtime ADD TABLE pixels;

-- 验证
SELECT * FROM pg_publication_tables
WHERE pubname = 'supabase_realtime' AND tablename = 'pixels';
```

### 4. 获取 API 凭证

1. 在 Supabase Dashboard 点击 "Settings" → "API"
2. 复制以下信息（稍后需要）:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon public**: `eyJhbGc...` (公开密钥)

---

## Vercel 部署

### 方法 1: 通过 GitHub（推荐）

#### 1. 推送代码到 GitHub

```bash
# 初始化 Git（如果还没有）
git init
git add .
git commit -m "Initial commit"

# 创建 GitHub 仓库并推送
# 在 GitHub 上创建新仓库: x402-pixel-war
git remote add origin https://github.com/YOUR_USERNAME/x402-pixel-war.git
git branch -M main
git push -u origin main
```

#### 2. 连接 Vercel

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "Add New..." → "Project"
3. 选择你的 GitHub 仓库: `x402-pixel-war`
4. 点击 "Import"

#### 3. 配置项目

**Framework Preset**: Next.js (自动检测)

**Root Directory**: `./` (默认)

**Build Command**: `npm run build` (默认)

**Output Directory**: `.next` (默认)

#### 4. 配置环境变量

在 "Environment Variables" 部分添加（见下一节）

#### 5. 部署

点击 "Deploy" 按钮，等待部署完成（约 2-5 分钟）

### 方法 2: 通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录
vercel login

# 部署
vercel

# 按照提示操作:
# - Set up and deploy? Yes
# - Which scope? [选择你的账号]
# - Link to existing project? No
# - What's your project's name? x402-pixel-war
# - In which directory is your code located? ./

# 生产部署
vercel --prod
```

---

## 环境变量配置

### 在 Vercel 中配置

在 Vercel Dashboard → Project Settings → Environment Variables 添加以下变量：

#### 1. Supabase 配置

```bash
# Supabase URL（从 Supabase Dashboard → Settings → API 获取）
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co

# Supabase 公开密钥（anon public key）
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 2. Solana 配置

**开发/演示环境（使用 Devnet）**:
```bash
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_HOST=https://api.devnet.solana.com
```

**生产环境（使用 Mainnet）**:
```bash
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_SOLANA_RPC_HOST=https://api.mainnet-beta.solana.com

# 或使用付费 RPC（推荐生产环境）
# NEXT_PUBLIC_SOLANA_RPC_HOST=https://solana-mainnet.g.alchemy.com/v2/YOUR_API_KEY
```

#### 3. x402 配置（可选）

```bash
# Mock 模式（演示用）
NEXT_PUBLIC_X402_MODE=mock

# 真实支付模式（需要 PayAI 集成）
# NEXT_PUBLIC_X402_MODE=production
# NEXT_PUBLIC_X402_API_KEY=your_payai_api_key
```

### 环境变量模板

创建 `.env.production`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Solana
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_HOST=https://api.devnet.solana.com

# x402
NEXT_PUBLIC_X402_MODE=mock
```

### 环境变量作用域

| 变量 | Development | Preview | Production |
|------|-------------|---------|------------|
| 所有变量 | ✅ | ✅ | ✅ |

建议为所有环境（Development, Preview, Production）添加相同的变量。

---

## Solana 网络配置

### Devnet（推荐用于演示）

**优点**:
- 免费测试代币
- 无需真实资金
- 快速迭代测试

**配置**:
```bash
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_HOST=https://api.devnet.solana.com
```

**获取测试代币**:
- SOL 水龙头: https://faucet.solana.com/
- 测试 USDC: 参考 [钱包设置指南](WALLET_SETUP.md)

### Mainnet（生产环境）

**注意事项**:
- ⚠️ 需要真实 SOL 和 USDC
- ⚠️ 真实资金有风险
- ⚠️ 建议使用付费 RPC 提高性能

**配置**:
```bash
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_SOLANA_RPC_HOST=https://api.mainnet-beta.solana.com
```

**推荐的 RPC 服务商**:
1. **Alchemy**: https://www.alchemy.com/solana
2. **Helius**: https://www.helius.dev/
3. **QuickNode**: https://www.quicknode.com/chains/sol

---

## 部署后验证

### 1. 访问应用

```bash
# Vercel 会自动提供 URL
https://your-project.vercel.app
```

### 2. 功能检查清单

- [ ] 页面正常加载
- [ ] 像素网格显示正确（50×30 = 1,500 个像素）
- [ ] 钱包连接按钮可见
- [ ] 连接 Phantom/Solflare 钱包
- [ ] 显示钱包地址和余额
- [ ] 点击像素弹出详情弹窗
- [ ] 单个像素占领功能
- [ ] 批量像素选择（Shift + 点击/拖动）
- [ ] 批量占领功能
- [ ] 实时同步（多个浏览器窗口测试）

### 3. 数据库验证

```sql
-- 检查像素数据
SELECT COUNT(*) FROM pixels;  -- 应该是 1500

-- 检查是否有占领记录
SELECT COUNT(*) FROM pixels WHERE wallet_owner IS NOT NULL;

-- 查看最近的占领
SELECT x, y, color, wallet_owner, last_conquered_at
FROM pixels
WHERE wallet_owner IS NOT NULL
ORDER BY last_conquered_at DESC
LIMIT 10;
```

### 4. 性能检查

使用 Lighthouse 检查性能：
- 打开 Chrome DevTools (F12)
- 点击 "Lighthouse" 标签
- 点击 "Generate report"

**目标指标**:
- Performance: > 80
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

---

## 故障排除

### 问题 1: 页面显示 500 错误

**原因**: 环境变量未配置或配置错误

**解决方案**:
```bash
# 检查 Vercel 环境变量
vercel env ls

# 添加缺失的变量
vercel env add NEXT_PUBLIC_SUPABASE_URL
```

### 问题 2: 钱包连接失败

**原因**: Solana 网络配置错误

**解决方案**:
1. 检查 `NEXT_PUBLIC_SOLANA_NETWORK` 是否为 `devnet` 或 `mainnet-beta`
2. 确保钱包也切换到对应网络
3. 清除浏览器缓存并刷新

### 问题 3: 像素网格不显示

**原因**: 数据库未初始化

**解决方案**:
```sql
-- 在 Supabase SQL Editor 执行
SELECT initialize_grid();

-- 验证
SELECT COUNT(*) FROM pixels;  -- 应该是 1500
```

### 问题 4: 实时同步不工作

**原因**: Realtime 未启用

**解决方案**:
```sql
-- 启用 pixels 表的实时同步
ALTER PUBLICATION supabase_realtime ADD TABLE pixels;
```

### 问题 5: 部署超时

**原因**: 构建时间过长

**解决方案**:
```bash
# 在 Vercel 项目设置中增加超时时间
# Settings → General → Build & Development Settings
# Maximum Build Duration: 15 分钟
```

### 问题 6: API 请求失败

**原因**: Supabase RLS 策略限制

**解决方案**:
```sql
-- 检查 RLS 策略
SELECT * FROM pg_policies WHERE tablename = 'pixels';

-- 临时禁用 RLS（仅用于调试）
ALTER TABLE pixels DISABLE ROW LEVEL SECURITY;
```

---

## 性能优化

### 1. Vercel 配置

创建 `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["sin1"],
  "functions": {
    "app/**/*.ts": {
      "maxDuration": 10
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "s-maxage=60, stale-while-revalidate"
        }
      ]
    }
  ]
}
```

### 2. Next.js 优化

在 `next.config.js` 中:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['supabase.co'],
  },
  experimental: {
    optimizeCss: true,
  },
}

module.exports = nextConfig
```

### 3. 数据库索引

```sql
-- 确保索引存在
CREATE INDEX IF NOT EXISTS idx_pixels_coordinates ON pixels(x, y);
CREATE INDEX IF NOT EXISTS idx_pixels_wallet_owner ON pixels(wallet_owner);
CREATE INDEX IF NOT EXISTS idx_pixels_price ON pixels(current_price);
```

### 4. Supabase 连接池

在生产环境使用连接池：
```typescript
// lib/supabase/client.ts
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: true,
    },
    global: {
      headers: { 'x-client-info': 'x402-pixel-war' },
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);
```

---

## 监控和日志

### Vercel Analytics

1. 在 Vercel Dashboard 启用 Analytics
2. 添加到应用:

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Supabase Logs

查看数据库日志：
- Supabase Dashboard → Logs
- 查看查询性能、错误等

### 错误追踪

推荐使用 Sentry:

```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

配置 `sentry.client.config.ts`:
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  tracesSampleRate: 1.0,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || 'development',
});
```

---

## 自定义域名（可选）

### 1. 在 Vercel 添加域名

1. Project Settings → Domains
2. 输入你的域名: `pixelwar.yourdomain.com`
3. 点击 "Add"

### 2. 配置 DNS

在你的域名提供商添加 CNAME 记录：

```
Type:  CNAME
Name:  pixelwar (或 @)
Value: cname.vercel-dns.com
TTL:   3600
```

### 3. 等待 DNS 传播（5-60 分钟）

验证:
```bash
dig pixelwar.yourdomain.com
```

---

## CI/CD 流程

Vercel 自动提供 CI/CD：

### 自动部署触发

- **Push to main**: 自动部署到生产环境
- **Push to other branches**: 创建预览部署
- **Pull Request**: 自动创建预览链接

### 手动部署

```bash
# 部署到生产环境
vercel --prod

# 部署预览
vercel
```

---

## 回滚部署

### 在 Vercel Dashboard

1. Deployments → 选择之前的部署
2. 点击 "..." → "Promote to Production"

### 使用 CLI

```bash
# 查看部署历史
vercel ls

# 回滚到特定部署
vercel promote DEPLOYMENT_URL
```

---

## 安全检查清单

- [ ] 环境变量已正确配置
- [ ] Supabase RLS 策略已启用
- [ ] 不要在客户端暴露私钥
- [ ] 使用 HTTPS（Vercel 自动提供）
- [ ] 启用 Supabase 数据库备份
- [ ] 配置 CORS（如需要）
- [ ] 启用速率限制（Vercel Pro）
- [ ] 定期更新依赖

---

## 成本估算

| 服务 | 免费额度 | 付费计划 |
|------|---------|---------|
| **Vercel** | Hobby 免费 | Pro $20/月 |
| **Supabase** | 500MB 数据库 | Pro $25/月 |
| **Solana RPC** | 公共 RPC 免费 | 付费 RPC $50-200/月 |

**Demo/测试**: 完全免费（使用免费额度）
**小规模生产**: 约 $50-100/月
**中等规模**: 约 $200-500/月

---

## 备份和恢复

### 数据库备份

```bash
# 使用 Supabase CLI 导出
npx supabase db dump -f backup.sql

# 恢复
psql -h db.xxx.supabase.co -U postgres -d postgres -f backup.sql
```

### 自动备份

Supabase Pro 计划提供每日自动备份。

---

## 下一步

- [ ] 配置自定义域名
- [ ] 启用 Vercel Analytics
- [ ] 设置错误追踪（Sentry）
- [ ] 配置性能监控
- [ ] 准备 Demo 演示

---

## 相关文档

- [API 文档](API.md)
- [用户手册](USER_GUIDE.md)
- [数据库设置](SETUP_DATABASE.md)
- [架构设计](ARCHITECTURE.md)

---

**最后更新**: 2026-01-23
**版本**: v1.0
