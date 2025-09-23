# 教师端壳应用

`apps/teacher-app` 提供教师视角的 H5 占位壳，复用 UI Kit 与导航样式，当前路由：

- `/classes` 班级总体概览；
- `/assignments` 待批改任务列表。

## 常用脚本

```bash
pnpm --filter @kids/teacher-app dev:h5
pnpm --filter @kids/teacher-app build
pnpm --filter @kids/teacher-app lint
```

页面组件均使用 `@kids/ui-kit`，后续接入真实数据时可直接替换占位文案。
