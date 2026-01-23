# Mintlify 文档设置指南

本项目已经配置好 Mintlify 文档系统。按照以下步骤部署您的文档网站。

---

## 📦 已完成的配置

✅ **配置文件**: `mint.json` - 主配置文件
✅ **文档首页**: `introduction.mdx` - 欢迎页面
✅ **快速开始**: `quickstart.mdx` - 5分钟上手指南
✅ **API 引导**: `api-reference/introduction.mdx` - API 文档入口
✅ **目录结构**: 已创建 `guides/`, `api-reference/`, `development/` 目录

---

## 🚀 部署到 Mintlify（3 种方法）

### 方法 1: 通过 GitHub 自动部署（推荐）

#### 步骤 1: 推送代码到 GitHub

```bash
# 1. 添加所有新文件
git add .

# 2. 提交
git commit -m "Add Mintlify documentation"

# 3. 推送到 GitHub
git push origin main
```

#### 步骤 2: 连接 Mintlify

1. 访问 [Mintlify Dashboard](https://dashboard.mintlify.com/)
2. 点击 "Create New Docs"
3. 选择 "Connect GitHub Repository"
4. 选择您的仓库: `x402-pixel-war`
5. 点击 "Deploy"

**完成！** 🎉
- Mintlify 会自动检测 `mint.json` 并部署
- 您会得到一个 URL: `https://your-project.mintlify.app`
- 每次推送到 GitHub，文档自动更新

---

### 方法 2: 使用 Mintlify CLI（本地预览）

#### 安装 CLI

```bash
npm install -g mintlify
```

#### 本地预览

```bash
# 在项目根目录运行
mintlify dev

# 或指定端口
mintlify dev --port 3001
```

打开浏览器访问 `http://localhost:3000`（或 3001）

#### 手动部署

```bash
# 构建静态文件
mintlify build

# 部署到 Mintlify
mintlify deploy
```

---

### 方法 3: 手动上传（无需 GitHub）

1. 访问 [Mintlify Dashboard](https://dashboard.mintlify.com/)
2. 点击 "Create New Docs"
3. 选择 "Manual Upload"
4. 打包并上传以下文件：
   - `mint.json`
   - `introduction.mdx`
   - `quickstart.mdx`
   - `api-reference/` 目录
   - `guides/` 目录
   - `development/` 目录

---

## 📝 完成部署后的操作

### 1. 更新游戏界面的 Docs 链接

编辑 `components/game/UserInfo.tsx` 或其他组件，添加 Docs 按钮：

```tsx
<a
  href="https://your-project.mintlify.app"
  target="_blank"
  className="px-4 py-2 bg-purple-600 rounded-lg"
>
  📚 Docs
</a>
```

### 2. 自定义域名（可选）

在 Mintlify Dashboard:
1. Settings → Custom Domain
2. 输入: `docs.yoursite.com`
3. 添加 CNAME 记录到您的 DNS:
   ```
   Type:  CNAME
   Name:  docs
   Value: cname.mintlify.com
   ```

### 3. 配置 Analytics（可选）

在 `mint.json` 中更新 Google Analytics ID:

```json
"analytics": {
  "ga4": {
    "measurementId": "G-YOUR-ACTUAL-ID"
  }
}
```

### 4. 更新社交链接

在 `mint.json` 中更新实际的链接:

```json
"footerSocials": {
  "twitter": "https://twitter.com/your-actual-handle",
  "github": "https://github.com/yourusername/x402-pixel-war",
  "discord": "https://discord.gg/your-invite-code"
}
```

---

## 📂 添加更多文档页面

### 创建新页面

```bash
# 创建用户指南页面
touch guides/overview.mdx
```

**guides/overview.mdx** 示例:

```mdx
---
title: 'User Guide Overview'
description: 'Complete guide to playing x402 Pixel War'
icon: 'book'
---

# User Guide

Your content here...
```

### 添加到导航

编辑 `mint.json`，在 `navigation` 中添加:

```json
{
  "group": "User Guide",
  "pages": [
    "guides/overview",
    "guides/basic-operations",
    "guides/strategies"
  ]
}
```

---

## 🎨 自定义主题

### 更新颜色

编辑 `mint.json` 中的 `colors`:

```json
"colors": {
  "primary": "#8B5CF6",    // 主色调
  "light": "#A78BFA",      // 浅色
  "dark": "#6D28D9",       // 深色
  "anchors": {
    "from": "#8B5CF6",     // 渐变起始
    "to": "#EC4899"        // 渐变结束
  }
}
```

### 添加 Logo

1. 创建 `public/logo/` 目录
2. 添加 `dark.svg` 和 `light.svg`
3. Mintlify 会自动使用

---

## 📊 目前的文档结构

```
x402's Pixel War/
├── mint.json                       # Mintlify 主配置
├── introduction.mdx                # 文档首页
├── quickstart.mdx                  # 快速开始
├── wallet-setup.mdx               # 钱包设置（待创建）
│
├── guides/                         # 用户指南
│   ├── overview.mdx               # （待创建）
│   ├── basic-operations.mdx       # （待创建）
│   ├── advanced-features.mdx      # （待创建）
│   ├── economics.mdx              # （待创建）
│   └── strategies.mdx             # （待创建）
│
├── api-reference/                  # API 文档
│   ├── introduction.mdx           # ✅ 已创建
│   ├── authentication.mdx         # （待创建）
│   ├── conquer-pixel.mdx          # （待创建）
│   ├── conquer-batch.mdx          # （待创建）
│   ├── recolor-pixel.mdx          # （待创建）
│   ├── recolor-batch.mdx          # （待创建）
│   ├── get-grid.mdx               # （待创建）
│   ├── get-wallet-pixels.mdx      # （待创建）
│   └── get-user-stats.mdx         # （待创建）
│
└── development/                    # 开发文档
    ├── architecture.mdx           # （待创建）
    ├── deployment.mdx             # （待创建）
    ├── database-setup.mdx         # （待创建）
    └── contributing.mdx           # （待创建）
```

---

## 🔄 从现有 Markdown 文档迁移

您在 `docs/` 目录中已经有完整的 Markdown 文档。可以这样迁移：

### 方法 1: 转换为 MDX

```bash
# 复制并重命名
cp docs/API.md api-reference/complete-api.mdx
cp docs/USER_GUIDE.md guides/complete-guide.mdx
cp docs/ARCHITECTURE.md development/architecture.mdx
cp docs/DEPLOYMENT.md development/deployment.mdx
```

然后在每个文件顶部添加 frontmatter:

```mdx
---
title: 'Your Title'
description: 'Description'
icon: 'icon-name'
---

[原有的 Markdown 内容]
```

### 方法 2: 分割大文档

将 `docs/API.md` 按功能分割成多个小文件：
- `api-reference/conquer-pixel.mdx`
- `api-reference/conquer-batch.mdx`
- 等等

**优势**: 更好的导航和 SEO

---

## 🐛 故障排除

### 问题 1: `mintlify dev` 无法启动

```bash
# 确保在项目根目录
cd "x402's Pixel War"

# 检查 mint.json 是否存在
ls mint.json

# 检查 JSON 格式是否正确
npm install -g jsonlint
jsonlint mint.json
```

### 问题 2: 页面 404

检查 `mint.json` 中的 `navigation` 路径是否正确：

```json
// ❌ 错误
"pages": ["api-reference/introduction.md"]

// ✅ 正确
"pages": ["api-reference/introduction"]
```

### 问题 3: 样式不显示

确保使用 MDX 组件语法：

```mdx
// ✅ 正确
<Card title="Title" icon="icon">
  Content
</Card>

// ❌ 错误（Markdown 不支持）
## Title with icon
```

---

## 📚 Mintlify 组件参考

### 常用组件

```mdx
<Card title="Title" icon="icon" href="/link">
  Card content
</Card>

<CardGroup cols={2}>
  <Card>Card 1</Card>
  <Card>Card 2</Card>
</CardGroup>

<Tabs>
  <Tab title="Tab 1">Content 1</Tab>
  <Tab title="Tab 2">Content 2</Tab>
</Tabs>

<Accordion title="Title">
  Collapsible content
</Accordion>

<AccordionGroup>
  <Accordion>...</Accordion>
  <Accordion>...</Accordion>
</AccordionGroup>

<Steps>
  <Step title="Step 1">...</Step>
  <Step title="Step 2">...</Step>
</Steps>

<CodeGroup>
  ```javascript
  // Code block 1
  ```
  ```python
  # Code block 2
  ```
</CodeGroup>
```

### 提示框

```mdx
<Note>注意信息</Note>
<Info>一般信息</Info>
<Warning>警告信息</Warning>
<Check>成功信息</Check>
```

---

## 🎯 下一步

1. ✅ 推送代码到 GitHub
2. ✅ 连接 Mintlify Dashboard
3. ⏳ 将现有 `docs/*.md` 文档转换为 MDX
4. ⏳ 完善 API 参考页面
5. ⏳ 添加代码示例
6. ⏳ 配置自定义域名

---

## 📞 获取帮助

- **Mintlify 文档**: https://mintlify.com/docs
- **Mintlify Discord**: https://discord.gg/mintlify
- **示例项目**: https://github.com/mintlify/starter

---

**最后更新**: 2026-01-23
**状态**: 基础配置完成，可以开始部署
