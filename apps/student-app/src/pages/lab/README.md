# 实验室运行状态机

## 状态
idle → running → success | error

## 交互
- running：运行按钮禁用；显示进度条
- success：展示 stdout + 奖励弹层（占位）
- error：展示 stderr/提示；可重试

## 流
1) blocks → code (python) → POST /execute (sessionId)
2) 订阅 ws: run-results/&lt;sessionId&gt;，收到 finished 合并到 UI