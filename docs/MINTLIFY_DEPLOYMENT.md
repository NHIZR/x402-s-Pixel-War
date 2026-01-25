# 🚀 Mintlify 文档网站部署步骤（私有仓库版）

## 📋 部署清单

- [ ] 创建私有 GitHub 仓库
- [ ] 推送代码到 GitHub
- [ ] 连接 Mintlify Dashboard
- [ ] 部署文档网站
- [ ] 测试文档访问

---

## 第 1 步：创建私有 GitHub 仓库

1. **访问 GitHub**
   👉 https://github.com/new

2. **填写仓库信息**
   - **Repository name**: `x402-pixel-war`
   - **Description**: `Solana 区块链多人像素征服游戏 - 完整项目 + Mintlify 文档`
   - **Visibility**: ⭐ 选择 **`Private`** （私有仓库）
   - **Initialize this repository**: 全部不勾选

3. **创建仓库**
   - 点击 "Create repository"
   - 记下仓库 URL（下一步需要）

---

## 第 2 步：推送代码到 GitHub

### 方法 A：使用命令行（推荐）

打开终端，在项目目录运行以下命令：

```bash
# 1. 进入项目目录
cd "/Users/lobesterk/Library/Mobile Documents/com~apple~CloudDocs/x402's Pixel War"

# 2. 初始化 Git 仓库
git init

# 3. 添加所有文件
git add .

# 4. 创建首次提交
git commit -m "Initial commit: Complete Day 3 documentation

- API documentation (8,000+ words)
- User guide (9,000+ words)
- Architecture docs (10,000+ words)
- Deployment guide (7,500+ words)
- Mintlify integration
- Total: 34,500+ words

Built with Claude Code by Anthropic"

# 5. 重命名主分支
git branch -M main

# 6. 添加远程仓库（替换 YOUR_USERNAME）
git remote add origin https://github.com/YOUR_USERNAME/x402-pixel-war.git

# 7. 推送到 GitHub
git push -u origin main
```

**重要**：替换 `YOUR_USERNAME` 为您的 GitHub 用户名！

### 方法 B：使用 GitHub Desktop（可选）

如果您使用 GitHub Desktop：

1. File → Add Local Repository
2. 选择项目目录
3. 创建新仓库并发布
4. 选择 **Private** visibility

---

## 第 3 步：连接 Mintlify Dashboard

### 3.1 访问 Mintlify

👉 https://dashboard.mintlify.com/

### 3.2 登录/注册

- 使用 GitHub 账号登录（推荐）
- 或使用 Google/Email 注册

### 3.3 创建新文档

1. 点击 **"Create New Docs"** 或 **"+ New Docs"**

2. 选择 **"Connect GitHub Repository"**

3. **授权 Mintlify 访问 GitHub**
   - 点击 "Authorize Mintlify"
   - ⭐ 确保授权包括私有仓库访问权限

4. **选择您的仓库**
   - 在仓库列表中找到 `x402-pixel-war`
   - 如果看不到，点击 "Configure GitHub App" 添加仓库访问权限

5. **配置部署**
   - **Branch**: `main`
   - **Root Directory**: `/` (留空或输入 `/`)
   - Mintlify 会自动检测 `mint.json` 配置文件

6. **点击 "Deploy"**
   - 等待 2-3 分钟构建
   - 构建成功后会显示文档 URL

---

## 第 4 步：获取文档网站 URL

部署成功后，您会得到：

```
https://your-project.mintlify.app
```

**示例**：
- `https://x402-pixel-war.mintlify.app`
- `https://pixel-war-docs.mintlify.app`

**注意**：
- 您的**代码保持私有**在 GitHub 上
- 但**文档是公开**访问的（这是好事！）
- 其他人只能看到文档，看不到源代码

---

## 第 5 步：测试文档网站

### 检查清单

访问您的文档 URL，确认以下内容：

- [ ] 首页正常加载（Introduction）
- [ ] 左侧导航栏显示正确
- [ ] "Quick Start" 页面可访问
- [ ] "API Reference" → "Introduction" 可访问
- [ ] 搜索功能工作（输入关键词测试）
- [ ] 代码块显示正确，有语法高亮
- [ ] 深色/浅色主题切换正常
- [ ] 移动端显示正常（用手机打开测试）

---

## 第 6 步：集成到游戏界面

### 添加 Docs 按钮

编辑游戏界面的顶部组件，添加文档链接：

```tsx
// components/game/UserInfo.tsx 或其他顶部组件

<a
  href="https://your-project.mintlify.app"  // 替换为实际 URL
  target="_blank"
  rel="noopener noreferrer"
  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
>
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
  Documentation
</a>
```

---

## 🎨 后续优化（可选）

### 1. 自定义域名

如果您有自己的域名：

1. 在 Mintlify Dashboard → Settings → Custom Domain
2. 输入: `docs.yourdomain.com`
3. 添加 CNAME 记录到 DNS:
   ```
   Type:  CNAME
   Name:  docs
   Value: cname.mintlify.com
   TTL:   3600
   ```
4. 等待 DNS 传播（5-60 分钟）

### 2. 更新社交链接

编辑 `mint.json`，更新实际的社交媒体链接：

```json
{
  "footerSocials": {
    "twitter": "https://twitter.com/your-handle",
    "github": "https://github.com/yourusername/x402-pixel-war",
    "discord": "https://discord.gg/your-invite"
  }
}
```

推送更新：
```bash
git add mint.json
git commit -m "Update social links"
git push
```

Mintlify 会自动重新部署（约 1-2 分钟）

### 3. 添加 Google Analytics

在 `mint.json` 中更新：

```json
{
  "analytics": {
    "ga4": {
      "measurementId": "G-YOUR-ACTUAL-ID"
    }
  }
}
```

### 4. 添加 Logo

1. 创建 `public/logo/` 目录
2. 添加 `dark.svg` 和 `light.svg`（品牌 logo）
3. 添加 `favicon.svg`（浏览器标签图标）
4. 推送到 GitHub

---

## 🔄 自动更新流程

一旦设置完成，以后更新文档非常简单：

```bash
# 1. 编辑文档文件
# 例如：编辑 introduction.mdx

# 2. 提交并推送
git add .
git commit -m "Update documentation"
git push

# 3. Mintlify 自动检测并重新部署（1-2 分钟）
# 无需手动操作！
```

---

## ⚠️ 常见问题

### Q1: 看不到私有仓库？

**解决方案**：
1. 访问 https://github.com/settings/installations
2. 找到 "Mintlify"
3. 点击 "Configure"
4. 在 "Repository access" 中选择 "All repositories" 或添加特定仓库

### Q2: 构建失败？

**检查**：
1. `mint.json` 格式是否正确（JSON 语法）
2. 导航路径是否正确（不包含 .mdx 扩展名）
3. 查看 Mintlify Dashboard 的构建日志

### Q3: 页面 404？

**原因**：导航配置中的文件路径不存在

**解决**：检查 `mint.json` 中的 `navigation.pages` 路径

### Q4: 代码无法推送？

**如果路径有空格**：
```bash
# 使用引号包裹路径
cd "/Users/lobesterk/Library/Mobile Documents/com~apple~CloudDocs/x402's Pixel War"
```

**如果遇到权限问题**：
```bash
# 使用 SSH 而不是 HTTPS
git remote set-url origin git@github.com:USERNAME/x402-pixel-war.git
```

---

## 📞 获取帮助

- **Mintlify 文档**: https://mintlify.com/docs
- **Mintlify Discord**: https://discord.gg/mintlify
- **GitHub 帮助**: https://docs.github.com/

---

## ✅ 完成检查清单

部署完成后，确认以下内容：

- [ ] GitHub 私有仓库创建成功
- [ ] 代码推送到 GitHub
- [ ] Mintlify 连接成功
- [ ] 文档网站可以访问
- [ ] 导航和搜索正常工作
- [ ] 游戏界面添加了 Docs 链接
- [ ] 测试了移动端显示

---

**预计总耗时**: 15-20 分钟

**最后更新**: 2026-01-23
**状态**: 准备部署 🚀
