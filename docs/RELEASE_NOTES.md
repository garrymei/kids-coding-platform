# 发布说明（2025-10-12）

## 变更概要

- 在 `packages/api/src/modules/classes/classes.module.ts` 注册 `ClassManagementService`，修复 NestJS 依赖注入错误，确保 `ClassesController` 的 `POST /classes/join` 与 `POST /classes/join-by-invite-code` 正常工作。

## 影响范围

- 仅影响 `classes` 模块的依赖注入配置，不改动业务逻辑与接口实现。

## 验证情况

- 构建：在 `/packages/api` 执行 `npm run build`，编译成功（exit code 0）。
- Lint：执行 `npm run lint`，无错误，仅有若干 `no-explicit-any` 与 `unused-vars` 警告。
- 单测：`npm test` 显示仍有 3 个失败，原因是测试模块未完整提供依赖（如 `PrismaService`），与此次改动无直接关联。

## 风险与回滚

- 风险较低：仅新增 Provider 不影响接口签名与持久化逻辑。
- 如需回滚，可恢复至变更前的 `8d9d83b`（参考 Git 历史）。

## 后续建议

- 修复失败用例：在测试模块中补充缺失依赖或使用 Mock（例如为 `UsersService` 提供 `PrismaService`）。
- 视需求启用 `ClassManagementController` 与 `ClassInviteController` 路由。
- 将 `RequestsController` 委托到 `RelationshipsService`，去除 `this.prisma as any` 以提升类型安全。

## 提交信息

- 已推送：`main -> main`，最新提交 `2fe75c8`。

## 相关文件

- 修改：`packages/api/src/modules/classes/classes.module.ts`
