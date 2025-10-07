# Kids Coding Platform · Games & Levels Master Pack (v1)

日期：2025-10-07

本包包含 **3 款核心教学游戏**（每款 10 个关卡），覆盖 **Python** 与 **JavaScript/Blockly** 两种语言：

- Maze Navigator（迷宫探索）→ 循环、顺序、调试（坐标移动）
- Turtle Artist（海龟画家）→ 角度、循环、函数（图形绘制）
- Robot Sorter（机器人分拣）→ 条件、数组、循环（基础算法）

## 目录结构

```
kids-coding-levels/
  README.md
  python/
    maze_navigator.json
    turtle_artist.json
    robot_sorter.json
  javascript/
    maze_navigator.json
    turtle_artist.json
    robot_sorter.json
```

## 关卡 Schema（通用）

```json
{
  "game_id": "maze_navigator",
  "language": "python",
  "title": "迷宫探索",
  "levels": [
    {
      "level": 1,
      "title": "向前一步",
      "objective": "让角色向前移动 1 步到达终点。",
      "story": "小探险家来到迷宫起点，终点就在前方。",
      "starter_code": "def solve():\n    # TODO\n    pass",
      "reference_solution": "def solve():\n    move_forward(1)",
      "expected_io": { "input": null, "output": "REACHED" },
      "judge": {
        "type": "api_events", // 通过事件流校验移动轨迹/终点状态（也可选 stdout_exact / unit_tests）
        "criteria": { "end_state": "REACHED" }
      },
      "hints": ["先调用 move_forward(1)"]
    }
  ]
}
```

## 判题策略建议

- **api_events**：前端记录移动/绘图事件序列，后端校验是否达到目标（位置、路径长度上限、转向次数等）。
- **stdout_exact / regex**：适合有明确文本输出的题目（如排序结果）。
- **unit_tests**：以函数返回值断言（如 `def solve(nums): return sorted(nums)`）。

> 提示：JS/Blockly 版本同时提供 `blockly_xml`（可选）与 `js_*` 源码字段，便于在编辑器间切换。
