# GitHub 分支保护设置指南

## 设置步骤

### 1. 进入仓库设置

1. 打开 GitHub 仓库页面
2. 点击 **Settings** 标签
3. 在左侧菜单中找到 **Branches**

### 2. 添加分支保护规则

1. 点击 **Add rule** 按钮
2. 在 **Branch name pattern** 中输入：`main`
3. 勾选以下选项：
   - ✅ **Require a pull request before merging**
     - ✅ **Require approvals** (建议设置为 1)
     - ✅ **Dismiss stale PR approvals when new commits are pushed**
   - ✅ **Require status checks to pass before merging**
     - ✅ **Require branches to be up to date before merging**
     - 在 **Status checks** 中选择：
       - `build` (构建检查)
       - `lint` (代码检查)
   - ✅ **Require conversation resolution before merging**
   - ✅ **Restrict pushes that create files larger than 100 MB**

### 3. 保存设置

1. 点击 **Create** 按钮
2. 确认设置已生效

## 验证设置

设置完成后，尝试创建一个测试 PR：

1. 创建新分支：`git checkout -b test-branch-protection`
2. 做一个小改动并提交
3. 推送分支：`git push origin test-branch-protection`
4. 在 GitHub 上创建 PR 到 main 分支
5. 验证：
   - PR 需要等待 CI 通过
   - 无法直接合并到 main 分支
   - 需要至少一个审批

## 注意事项

- 确保 CI 工作流正常运行
- 建议设置至少 1 个审批者
- 可以设置自动合并（当所有检查通过且获得审批时）
