# 关卡与游戏包（Language → Game → Levels）

- 语言：目前 `python/`，后续可加 `javascript/`
- 游戏类型 = 实验岛区域：
  - `io`（灯塔区），`led`（能源站），`maze`（遗迹迷宫），`pixel`（像素画廊），`music`（音乐森林），`open`（创意工坊）
- 难度：`beginner` → `intermediate` → `advanced` → `challenge`

## 判题模式

- `io`：输入/输出比对（exact/tolerance/regex）
- `led/maze`：事件流（eventSeq / goal / maxSteps）
- `pixel`：矩阵终局对比
- `music`：音符序列（pitch+tick）对比
- `open`：半自动规则+教师点评

> 请用 `schemas/level.schema.json` 进行 JSON 校验；每个游戏包的元数据参照 `pack.schema.json`。
