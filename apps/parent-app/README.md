# 家长端壳应用

`apps/parent-app` 为家长视角提供 H5 壳层，沿用 UI Kit 与基础导航布局。路由暂包含：

- `/dashboard` 家庭概览（学习时长、待关注事项）；
- `/reports` 学习报告占位（导出按钮、能力雷达占位）。

## 常用脚本

```bash
pnpm --filter @kids/parent-app dev:h5
pnpm --filter @kids/parent-app build
pnpm --filter @kids/parent-app lint
```

页面使用 `@kids/ui-kit` 的 `Card`、`Button`、`Badge`、`Progress` 组件以及同一套全局样式，便于后续按需扩展真实数据。
