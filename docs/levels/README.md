# 关卡数据（Demo Set）

- 语言：Python (`lang: "python"`)
- 类型：`io`（输入输出）、`grid-led`（灯泡/事件流）、`pixel-art`（像素矩阵）、`maze-bot`（迷宫/事件流）
- 判题：
  - `io`: 精确/容差/正则
  - `event`: 收集事件并比对序列/终局
  - `structure`: AST 结构要求（如必须使用 for/def）

统一返回体（判题结果）应包含：
```json
{"ok":true,"stars":3,"score":3,"stdout":"","stderr":"","events":[],"violations":[],"timeMs":120,"rewards":{"xp":30,"coins":10,"badges":["循环达人"]}}
```

这些 Demo 用于打通“取关卡→提交→执行→判题→奖励”的闭环。实际生产可把 starter.blockly 替换为真实 XML。