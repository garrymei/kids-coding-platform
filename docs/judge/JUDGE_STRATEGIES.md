# 判题策略文档

## 概述

本文档描述了儿童编程平台中各种判题策略的实现和使用方法。判题策略负责比较学生代码的执行结果与期望输出，并给出详细的反馈。

## 统一判题接口

所有判题策略都遵循统一的接口规范，避免在策略层解析代码，统一使用执行产物。

### 接口定义

```typescript
export interface JudgeInput {
  strategy: string;
  expected: any;
  output: {
    stdout?: string;
    events?: Array<Record<string, any>>;
    artifacts?: Record<string, any>;
  };
  args?: any;
  metadata?: Record<string, any>;
}

export interface JudgeResult {
  passed: boolean;
  message: string;
  details?: string;
  visualization?: any;
  metrics?: Record<string, number>;
  diff?: any;
  warnings?: string[];
}
```

## 支持的策略

### 1. IO 策略 (io)

比较标准输出与期望文本。

**输入格式**:
- `expected`: 期望的文本输出
- `output.stdout`: 实际的标准输出

**参数**:
- `caseSensitive`: 是否区分大小写 (默认: false)
- `trimWhitespace`: 是否去除首尾空白 (默认: true)

### 2. LED 策略 (led)

比较LED序列与期望的LED状态变化。

**输入格式**:
- `expected`: 期望的LED序列
- `output.events`: LED事件数组

**事件格式**:
```
on <index>    # 点亮LED
off <index>   # 熄灭LED
```

### 3. 事件序列策略 (event-seq)

比较事件序列与期望序列。

**输入格式**:
- `expected`: 期望的事件序列
- `output.events`: 实际事件数组

### 4. 像素策略 (pixel)

比较像素矩阵与期望的像素图案。

**输入格式**:
- `expected`: 期望的像素矩阵
- `output.artifacts.pixelMatrix`: 实际的像素矩阵

**参数**:
- `tolerance`: 像素值容差 (默认: 0)
- `similarityThreshold`: 相似度阈值 (默认: 0.95)
- `mode`: 比较模式 'gray'|'binary'|'rgb' (默认: 'gray')
- `perChannelTolerance`: RGB通道容差 (默认: 5)
- `allowScale`: 是否允许缩放 (默认: false)

**支持的输入格式**:

1. **JSON格式** (推荐):
```python
print(f"PIXEL_MATRIX: {json.dumps({
    'width': 3,
    'height': 3,
    'pixels': [[0,0,0], [0,1,0], [0,0,0]]
})}")
```

2. **命令格式**:
```python
print("pixel 0 0 0")
print("pixel 1 1 1")
print("pixel 2 2 0")
```

### 5. 音乐策略 (music)

比较音乐序列与期望的音符序列。

**输入格式**:
- `expected`: 期望的音乐序列
- `output.artifacts.musicSeq`: 实际的音乐序列

**参数**:
- `tempoTolerance`: 节拍容差 (默认: 2 BPM)
- `onsetWindow`: 起始时间窗口 (默认: 0.05 拍)
- `durTolerance`: 时值容差 (默认: 0.05 拍)
- `scoreThreshold`: 通过阈值 (默认: 0.85)
- `pitchEquivalence`: 音高等价性 'strict'|'ignoreOctave'|'nearest' (默认: 'strict')

**支持的输入格式**:

1. **JSON格式** (推荐):
```python
print(f"MUSIC_SEQ: {json.dumps({
    'tempo': 120,
    'notes': [
        {'pitch': 'C4', 'dur': 0.5, 'start': 0},
        {'pitch': 'E4', 'dur': 0.5, 'start': 0.5}
    ]
})}")
```

2. **命令格式**:
```python
print("tempo 120")
print("note 1 C4 0.5")
print("note 1 E4 0.5")
```

## 执行输出与事件→artifacts 映射

### 像素矩阵映射

执行器会自动从以下来源提取像素矩阵：

1. **PIXEL_MATRIX JSON**: 从stdout中查找 `PIXEL_MATRIX: {...}` 格式的JSON数据
2. **pixel事件**: 从事件流中收集 `pixel x y value` 事件
3. **pixel命令**: 从stdout中解析 `pixel x y value` 命令

提取的像素矩阵会存储在 `output.artifacts.pixelMatrix` 中。

### 音乐序列映射

执行器会自动从以下来源提取音乐序列：

1. **MUSIC_SEQ JSON**: 从stdout中查找 `MUSIC_SEQ: {...}` 格式的JSON数据
2. **note/tempo事件**: 从事件流中收集音符和节拍事件
3. **note/tempo命令**: 从stdout中解析音符和节拍命令

提取的音乐序列会存储在 `output.artifacts.musicSeq` 中。

## 使用示例

### 在关卡中配置判题策略

```json
{
  "id": "pixel-001",
  "title": "绘制十字",
  "judge": {
    "strategy": "pixel",
    "expected": {
      "width": 3,
      "height": 3,
      "pixels": [
        [0, 1, 0],
        [1, 1, 1],
        [0, 1, 0]
      ]
    },
    "args": {
      "tolerance": 0,
      "similarityThreshold": 0.95,
      "allowScale": false
    }
  }
}
```

### 在代码中使用

```python
# 像素策略示例
import json

# 方法1: 使用JSON格式 (推荐)
pixels = [
    [0, 1, 0],
    [1, 1, 1],
    [0, 1, 0]
]
print(f"PIXEL_MATRIX: {json.dumps({
    'width': 3,
    'height': 3,
    'pixels': pixels
})}")

# 方法2: 使用命令格式
print("pixel 0 1 1")
print("pixel 1 0 1")
print("pixel 1 1 1")
print("pixel 1 2 1")
print("pixel 2 1 1")
```

```python
# 音乐策略示例
import json

# 方法1: 使用JSON格式 (推荐)
notes = [
    {'pitch': 'C4', 'dur': 0.5, 'start': 0},
    {'pitch': 'E4', 'dur': 0.5, 'start': 0.5},
    {'pitch': 'G4', 'dur': 1.0, 'start': 1.0}
]
print(f"MUSIC_SEQ: {json.dumps({
    'tempo': 120,
    'notes': notes
})}")

# 方法2: 使用命令格式
print("tempo 120")
print("note 1 C4 0.5")
print("note 1 E4 0.5")
print("note 1 G4 1.0")
```

## 错误处理

所有策略都会返回统一的错误格式：

```typescript
{
  passed: false,
  message: "错误描述",
  details: "详细错误信息",
  warnings?: ["警告信息"]
}
```

常见错误类型：
- `No pixel matrix found`: 未找到像素矩阵数据
- `No music sequence found`: 未找到音乐序列数据
- `Dimension mismatch`: 尺寸不匹配
- `Judge evaluation failed`: 判题评估失败

## 性能考虑

1. **缓存**: 执行产物会被缓存，避免重复解析
2. **容差**: 使用容差比较减少严格匹配的性能开销
3. **缩放**: 像素矩阵缩放使用最近邻算法，性能较好
4. **事件流**: 事件解析采用流式处理，内存占用低

## 扩展性

添加新的判题策略：

1. 实现 `JudgeStrategy` 接口
2. 在 `StrategyFactory` 中注册
3. 更新事件解析器支持新的事件类型
4. 添加相应的单元测试

## 测试

每个策略都有完整的单元测试覆盖：

```bash
# 运行所有策略测试
npm test packages/judge-stub/src/strategies/

# 运行特定策略测试
npm test packages/judge-stub/src/strategies/pixel.strategy.test.ts
npm test packages/judge-stub/src/strategies/music.strategy.test.ts
```
