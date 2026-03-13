---
name: commit-changes
description: >
  暂存、提交和修改变更，使用规范化提交消息。涵盖审查变更、选择性暂存、
  使用 HEREDOC 格式编写描述性提交消息，以及验证提交历史。适用于将逻辑工作
  单元保存到版本控制、创建规范化提交消息、修改最近一次提交或在提交前审查
  已暂存的变更。
license: MIT
allowed-tools: Read Write Edit Bash Grep Glob
metadata:
  author: Philipp Thoss
  version: "1.0"
  domain: git
  complexity: basic
  language: multi
  tags: git, commit, staging, conventional-commits, version-control
  locale: zh-CN
  source_locale: en
  source_commit: 6a868d56
  translator: Claude Opus 4.6
  translation_date: "2026-03-13"
---

# 提交变更

选择性暂存文件、编写清晰的提交消息，并验证提交历史。

## 适用场景

- 将逻辑工作单元保存到版本控制
- 创建带有描述性规范化消息的提交
- 修改最近一次提交（消息或内容）
- 提交前审查待提交的内容

## 输入

- **必需**：一个或多个已变更的文件
- **可选**：提交消息（未提供时将自动草拟）
- **可选**：是否修改上一次提交
- **可选**：共同作者署名

## 步骤

### 第 1 步：审查当前变更

检查工作树状态并查看差异：

```bash
# 查看哪些文件已修改、已暂存或未跟踪
git status

# 查看未暂存的变更
git diff

# 查看已暂存的变更
git diff --staged
```

**预期结果：** 清楚了解所有已修改、已暂存和未跟踪的文件。

**失败处理：** 如果 `git status` 执行失败，请确认当前目录在 git 仓库内（`git rev-parse --is-inside-work-tree`）。

### 第 2 步：选择性暂存文件

逐个暂存特定文件，避免使用 `git add .` 或 `git add -A`，以防意外包含敏感文件或无关变更：

```bash
# 按文件名暂存特定文件
git add src/feature.R tests/test-feature.R

# 暂存特定目录下的所有变更
git add src/

# 交互式暂存文件的部分内容（非交互环境下不支持）
# git add -p filename
```

提交前审查已暂存的内容：

```bash
git diff --staged
```

**预期结果：** 只有预期的文件和变更被暂存。不包含 `.env`、凭证或大型二进制文件。

**失败处理：** 使用 `git reset HEAD <file>` 取消误暂存的文件。如果敏感数据已被暂存，必须在提交前立即取消暂存。

### 第 3 步：编写提交消息

使用规范化提交格式。始终通过 HEREDOC 传递消息以确保格式正确：

```bash
git commit -m "$(cat <<'EOF'
feat: add weighted mean calculation

Implements weighted_mean() with support for NA handling and
zero-weight filtering. Includes input validation for mismatched
vector lengths.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

规范化提交类型：

| 类型 | 使用场景 |
|------|----------|
| `feat` | 新功能 |
| `fix` | 修复缺陷 |
| `docs` | 仅文档变更 |
| `test` | 添加或更新测试 |
| `refactor` | 既不修复缺陷也不添加功能的代码变更 |
| `chore` | 构建、CI、依赖更新 |
| `style` | 格式、空白调整（无逻辑变更） |

**预期结果：** 成功创建提交，消息描述了*为什么*变更，而非仅仅*做了什么*。

**失败处理：** 如果 pre-commit 钩子失败，修复问题后用 `git add` 重新暂存，然后创建**新的**提交（不要使用 `--amend`，因为失败的提交从未被创建）。

### 第 4 步：修改上一次提交（可选）

仅在提交**尚未**推送到共享远程分支时才进行修改：

```bash
# 仅修改消息
git commit --amend -m "$(cat <<'EOF'
fix: correct weighted mean edge case for empty vectors

EOF
)"

# 修改时追加已暂存的变更
git add forgotten-file.R
git commit --amend --no-edit
```

**预期结果：** 上一次提交被原地更新。`git log -1` 显示修改后的内容。

**失败处理：** 如果提交已被推送，不要修改。改为创建新的提交。对共享分支强制推送修改后的提交会导致历史分叉。

### 第 5 步：验证提交

```bash
# 查看最近一次提交
git log -1 --stat

# 查看最近的提交历史
git log --oneline -5

# 查看提交内容
git show HEAD
```

**预期结果：** 提交出现在历史中，消息、作者和文件变更均正确。

**失败处理：** 如果提交包含了错误的文件，使用 `git reset --soft HEAD~1` 撤销提交但保留已暂存的变更，然后重新正确提交。

## 验证清单

- [ ] 提交仅包含预期的文件
- [ ] 未提交敏感数据（令牌、密码、`.env` 文件）
- [ ] 提交消息遵循规范化提交格式
- [ ] 消息正文说明了变更的*原因*
- [ ] `git log` 显示提交的元数据正确
- [ ] pre-commit 钩子（如有）已通过

## 常见问题

- **单次提交包含过多变更**：每次提交应代表一个逻辑变更。将不相关的变更拆分为多个提交。
- **盲目使用 `git add .`**：始终先审查 `git status`。优先按文件名暂存特定文件。
- **修改已推送的提交**：绝不修改已推送到共享分支的提交。这会重写历史，给协作者造成问题。
- **模糊的提交消息**："fix bug" 或 "update" 毫无信息量。应描述变更了什么及其原因。
- **内容修改时忘记 `--no-edit`**：向上一次提交追加遗漏文件时，使用 `--no-edit` 保留现有消息。
- **钩子失败后使用 `--amend`**：pre-commit 钩子失败时，提交从未被创建。使用 `--amend` 会修改*上一次*提交。修复钩子问题后，始终创建新的提交。

## 相关技能

- `manage-git-branches` - 提交前的分支工作流
- `create-pull-request` - 提交后的下一步操作
- `resolve-git-conflicts` - 处理合并/变基时的冲突
- `configure-git-repository` - 仓库设置与规范
