# 🔧 Mintlify 配置修复说明

## 问题诊断

您的 Mintlify 项目 (https://dashboard.mintlify.com/x402spixelwar/x402spixelwar) 构建失败的原因：

### ❌ 原始问题
**`mint.json` 配置了 20+ 个页面，但只有 3 个 `.mdx` 文件存在**

配置的页面：
- ❌ `wallet-setup.mdx` - 不存在
- ❌ `guides/overview.mdx` - 不存在
- ❌ `guides/basic-operations.mdx` - 不存在
- ❌ `api-reference/conquer-pixel.mdx` - 不存在
- ... 还有 15+ 个文件不存在

实际存在的文件：
- ✅ `introduction.mdx`
- ✅ `quickstart.mdx`
- ✅ `api-reference/introduction.mdx`

### ✅ 已修复
我已经修改了 `mint.json`，只包含现有的 3 个文件：

```json
{
  "navigation": [
    {
      "group": "Getting Started",
      "pages": [
        "introduction",
        "quickstart"
      ]
    },
    {
      "group": "API Reference",
      "pages": [
        "api-reference/introduction"
      ]
    }
  ]
}
```

---

## 🚀 现在如何重新部署

### 方法 1: 推送修复到 GitHub（如果已连接）

如果您已经将项目连接到 GitHub：

```bash
# 1. 提交修复
git add mint.json
git commit -m "Fix: Simplify mint.json to only include existing pages"

# 2. 推送
git push origin main

# 3. Mintlify 会自动重新构建（1-2 分钟）
```

### 方法 2: 在 Mintlify Dashboard 手动触发重新部署

1. 访问 https://dashboard.mintlify.com/x402spixelwar/x402spixelwar
2. 点击 "Deployments" 或 "Settings"
3. 点击 "Redeploy" 或 "Trigger Build"

### 方法 3: 重新上传配置

1. 访问 Dashboard → Settings
2. 重新上传 `mint.json`
3. 触发构建

---

## ✅ 验证修复

修复后，您应该能看到：

```
https://x402spixelwar.mintlify.app/

📄 Introduction (首页)
   - 游戏介绍
   - 核心特性
   - 技术栈

🚀 Quick Start
   - 钱包安装
   - 测试代币
   - 第一次占领

💻 API Reference
   - API Introduction
   - 认证说明
   - 数据模型
```

---

## 📝 后续：添加更多页面

等基础配置工作后，可以逐步添加更多页面。

### 创建新页面的步骤

**步骤 1**: 创建 `.mdx` 文件

```bash
# 创建钱包设置页面
cat > wallet-setup.mdx << 'EOF'
---
title: 'Wallet Setup'
description: 'How to set up your Solana wallet'
icon: 'wallet'
---

# Wallet Setup Guide

Your content here...
EOF
```

**步骤 2**: 更新 `mint.json`

```json
{
  "navigation": [
    {
      "group": "Getting Started",
      "pages": [
        "introduction",
        "quickstart",
        "wallet-setup"  // ← 添加新页面
      ]
    }
  ]
}
```

**步骤 3**: 推送更新

```bash
git add wallet-setup.mdx mint.json
git commit -m "Add wallet setup page"
git push
```

---

## 🎯 推荐的页面添加顺序

### 阶段 1: 核心页面（已完成 ✅）
- ✅ introduction.mdx
- ✅ quickstart.mdx
- ✅ api-reference/introduction.mdx

### 阶段 2: 基础扩展（优先）
1. `wallet-setup.mdx` - 钱包设置详细指南
2. `api-reference/conquer-pixel.mdx` - 单个占领 API
3. `api-reference/conquer-batch.mdx` - 批量占领 API

### 阶段 3: 完整文档
4. 用户指南页面 (guides/)
5. 开发文档页面 (development/)
6. 更多 API 页面

---

## 🛠️ 从现有 Markdown 文档转换

您已经有完整的文档在 `docs/` 目录：
- `docs/API.md` (8,000+ 字)
- `docs/USER_GUIDE.md` (9,000+ 字)
- `docs/ARCHITECTURE.md` (10,000+ 字)
- `docs/DEPLOYMENT.md` (7,500+ 字)

### 转换脚本

我可以帮您创建一个脚本，将这些大文档分割成多个小的 `.mdx` 文件：

```bash
# 例如：将 API.md 分割成多个小页面
# docs/API.md → api-reference/conquer-pixel.mdx
#            → api-reference/conquer-batch.mdx
#            → api-reference/recolor-pixel.mdx
#            ... 等等
```

---

## 🐛 常见错误和解决方案

### 错误 1: "Page not found" 或 404

**原因**: `mint.json` 中配置的页面文件不存在

**解决**:
```bash
# 检查所有配置的页面是否存在
cat mint.json | grep "pages" -A 20
ls introduction.mdx quickstart.mdx api-reference/introduction.mdx
```

### 错误 2: "Invalid JSON"

**原因**: `mint.json` 语法错误

**解决**:
```bash
# 验证 JSON 语法
node -e "JSON.parse(require('fs').readFileSync('mint.json', 'utf8'))"
```

### 错误 3: 构建卡住

**原因**: Mintlify 服务问题或配置错误

**解决**:
1. 检查 Mintlify Status: https://status.mintlify.com/
2. 在 Dashboard 查看构建日志
3. 尝试手动触发重新构建

---

## 📞 获取帮助

如果问题仍然存在：

1. **检查构建日志**:
   - Dashboard → Deployments → 点击最新构建
   - 查看详细错误信息

2. **Mintlify 社区**:
   - Discord: https://discord.gg/mintlify
   - 文档: https://mintlify.com/docs

3. **告诉我错误信息**:
   - 复制构建日志中的错误
   - 我可以帮您诊断具体问题

---

## ✅ 验证清单

部署成功后，确认：

- [ ] 访问 URL 能正常打开
- [ ] 左侧导航显示 "Getting Started" 和 "API Reference"
- [ ] Introduction 页面正常显示
- [ ] Quick Start 页面正常显示
- [ ] API Reference → Introduction 页面正常显示
- [ ] 搜索功能工作
- [ ] 深色/浅色主题切换正常

---

**最后更新**: 2026-01-23
**状态**: mint.json 已修复，可以重新部署
