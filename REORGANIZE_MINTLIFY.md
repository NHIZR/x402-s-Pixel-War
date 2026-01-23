# Mintlify 文件重组方案

## 问题

当前 Mintlify 相关文件散落在项目根目录，导致：
- ❌ 根目录杂乱（introduction.mdx, quickstart.mdx, mint.json）
- ❌ 与游戏代码混在一起
- ❌ 难以管理

## 方案：不重组，保持现状

**重要决定：不建议重组文件到子目录**

### 原因

Mintlify 默认期望配置文件在**项目根目录**：
- `mint.json` 必须在根目录
- `introduction.mdx`、`quickstart.mdx` 等页面也应该在根目录或一级子目录

如果移动到 `mintlify-docs/` 子目录：
- ❌ 需要修改 `mint.json` 中所有路径
- ❌ 需要在 Mintlify Dashboard 配置 Root Directory
- ❌ 可能导致更多配置问题
- ❌ 增加复杂度

### 推荐方案：保持现状 + 清晰注释

**保留在根目录**：
```
project/
├── mint.json              # Mintlify 配置（必须在根目录）
├── introduction.mdx       # 文档首页
├── quickstart.mdx         # 快速开始
├── api-reference/         # API 文档目录
├── guides/                # 用户指南目录（暂时为空）
├── development/           # 开发文档目录（暂时为空）
├── app/                   # Next.js 应用代码
├── components/            # React 组件
├── lib/                   # 工具库
└── docs/                  # 原始 Markdown 文档（保留）
```

### 为什么这样更好

1. **符合 Mintlify 惯例** - 大多数项目都这样组织
2. **简单直接** - 不需要额外配置
3. **易于维护** - 文件路径清晰
4. **自动部署** - GitHub 推送后自动更新

### 文件作用说明

| 文件/目录 | 作用 | 保留位置 |
|----------|------|---------|
| `mint.json` | Mintlify 主配置 | ✅ 根目录（必须） |
| `introduction.mdx` | 文档首页 | ✅ 根目录 |
| `quickstart.mdx` | 快速开始 | ✅ 根目录 |
| `api-reference/` | API 文档 | ✅ 根目录 |
| `docs/` | 原始 Markdown 文档 | ✅ 根目录（源文件） |
| `app/`, `components/`, `lib/` | 游戏代码 | ✅ 根目录 |

---

## 实际操作：只修复内容问题

### 问题 1: 页面显示为空 ✅ 已修复

**原因**: `introduction.mdx` 引用了不存在的图片

**修复**: 移除了图片引用，添加标题

```mdx
# 修复前（有问题）
<img src="/images/hero-light.png" />  ← 图片不存在

# 修复后
# Welcome to x402's Pixel War  ← 直接用标题
```

### 问题 2: 其他页面也可能有问题

让我检查 `quickstart.mdx` 和 `api-reference/introduction.mdx`

---

## 后续优化建议

### 1. 添加 .gitignore 注释

在 `.gitignore` 中添加注释说明：

```bash
# Mintlify documentation files (keep in root directory)
# mint.json, *.mdx, api-reference/, guides/, development/
```

### 2. 添加 README 说明

在项目 README 中添加文档结构说明：

```markdown
## 文档结构

- `mint.json` - Mintlify 配置
- `*.mdx` - 文档页面（Mintlify 格式）
- `docs/` - 原始 Markdown 文档（源文件）
- 在线文档: https://x402spixelwar.mintlify.app
```

### 3. 创建 docs 和 mintlify 的对应关系

| 源文件 (docs/) | Mintlify 页面 | 状态 |
|---------------|--------------|------|
| - | introduction.mdx | ✅ 已创建 |
| - | quickstart.mdx | ✅ 已创建 |
| API.md | api-reference/*.mdx | ⏳ 待拆分 |
| USER_GUIDE.md | guides/*.mdx | ⏳ 待拆分 |
| ARCHITECTURE.md | development/architecture.mdx | ⏳ 待转换 |
| DEPLOYMENT.md | development/deployment.mdx | ⏳ 待转换 |

---

## 结论

**不重组文件，保持现状是最佳方案**

优势：
- ✅ 符合 Mintlify 最佳实践
- ✅ 配置简单，不易出错
- ✅ 自动部署正常工作
- ✅ 易于团队协作

劣势：
- ⚠️ 根目录文件略多（但这是正常的）

---

**最后更新**: 2026-01-23
**决定**: 保持文件在根目录，不重组
