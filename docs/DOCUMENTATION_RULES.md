# 文档组织规范

## 📋 核心原则

**根目录保持清爽，文档统一归档**

---

## ✅ 规则

### 1. 根目录文档限制

**禁止在根目录创建大量 Markdown 文档**

❌ 不允许：
```
project/
├── FEATURE_A.md
├── FEATURE_B.md
├── BUGFIX_C.md
├── SETUP_D.md
├── GUIDE_E.md
└── ...（大量 .md 文件）
```

✅ 允许保留（仅限必要文件）：
```
project/
├── README.md           # 项目主文档（必须）
├── DEPLOYMENT_STEPS.md # 部署指南（实用）
└── [代码目录...]
```

### 2. 文档归档规则

**所有文档必须按照类型归档到对应目录**

#### 规则 A: 可重组的文档
如果文档可以合并或整合到现有文档中，**优先重组**，避免创建新文件。

**示例**：
- 小的功能说明 → 合并到 `README.md` 或 `docs/ARCHITECTURE.md`
- API 更新说明 → 合并到 `docs/API.md`
- 部署补充说明 → 合并到 `DEPLOYMENT_STEPS.md`

#### 规则 B: 不可重组的文档
如果文档是独立的、完整的主题，**必须放入 `docs/` 目录**。

**目录结构**：
```
docs/
├── API.md              # API 参考文档
├── ARCHITECTURE.md     # 架构设计文档
├── DEPLOYMENT.md       # 部署完整指南
├── USER_GUIDE.md       # 用户指南
├── HACKATHON.md        # 项目日志
├── GETTING_STARTED.md  # 快速开始
├── SETUP_DATABASE.md   # 数据库配置
└── [其他文档...]
```

### 3. 临时文档处理

**临时性文档在使用完成后必须删除或归档**

❌ 不允许长期保留：
- 修复问题的临时说明文档（问题解决后删除）
- 配置调试文档（配置完成后删除）
- 部署脚本的临时说明（部署完成后删除）

✅ 处理方式：
1. **删除**：问题已解决，信息已过时 → 直接删除
2. **归档**：有历史价值 → 移动到 `docs/archive/`
3. **合并**：有用信息 → 提取关键内容合并到正式文档

### 4. 特殊文档目录

**特定用途的文档使用专用目录**

| 目录 | 用途 | 示例 |
|------|------|------|
| `docs/` | 正式技术文档 | API.md, ARCHITECTURE.md |
| `docs-mintlify/` | Mintlify 在线文档源文件 | introduction.mdx, quickstart.mdx |
| `docs/archive/` | 历史文档归档 | 旧版本说明、已解决问题的文档 |
| `.github/` | GitHub 相关文档 | CONTRIBUTING.md, ISSUE_TEMPLATE |

---

## 📝 文档创建检查清单

在创建任何新文档之前，问自己：

- [ ] 这个内容能否合并到现有文档？
- [ ] 这是临时文档还是长期文档？
- [ ] 如果是长期文档，应该放在哪个目录？
- [ ] 根目录是否会因此变得杂乱？

**如果回答不清楚，默认放入 `docs/` 目录**

---

## 🎯 最终目标

### 理想的根目录结构

```
x402-s-Pixel-War/
├── README.md                  # 项目主文档
├── DEPLOYMENT_STEPS.md        # 部署指南
├── DOCUMENTATION_RULES.md     # 本文档
│
├── docs/                      # 所有正式文档
│   ├── README.md
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT.md
│   ├── USER_GUIDE.md
│   └── ...
│
├── docs-mintlify/             # Mintlify 文档
│   ├── mint.json
│   ├── introduction.mdx
│   └── ...
│
├── app/                       # Next.js 应用
├── components/                # React 组件
├── lib/                       # 工具库
├── supabase/                  # 数据库配置
├── scripts/                   # 脚本文件
└── [配置文件...]
```

**根目录最多保留 2-3 个文档文件**

---

## ⚠️ 执行建议

### 定期清理（每周）
```bash
# 检查根目录的 .md 文件
ls -lh *.md

# 如果超过 3 个，审查并归档
mkdir -p docs/archive/$(date +%Y-%m-%d)
mv TEMP_*.md docs/archive/$(date +%Y-%m-%d)/
```

### 提交前检查
```bash
# 在 git commit 前检查
git status | grep "\.md$"

# 确认新增的 .md 文件是否在正确位置
```

---

**最后更新**: 2026-01-23
**状态**: 生效中
