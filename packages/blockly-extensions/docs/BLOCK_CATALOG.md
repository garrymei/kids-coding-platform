# Blockly 积木清单与命名约定

## 命名约定

### 块类型命名

- 所有块类型使用 `kids_` 前缀
- 使用下划线分隔单词：`kids_repeat_times`
- 动词在前，名词在后：`kids_set_variable` 而不是 `kids_variable_set`

### 块分类

- **控制类** (`control`): 循环、等待、条件判断
- **变量类** (`variables`): 设置、修改、获取变量
- **逻辑类** (`logic`): 比较、布尔运算、数学运算

## 积木清单

### 控制类积木

| 积木名称            | 类型   | 功能描述                         | 颜色    |
| ------------------- | ------ | -------------------------------- | ------- |
| `kids_repeat_times` | 语句块 | 重复指定次数                     | #6C63FF |
| `kids_wait_seconds` | 语句块 | 等待指定秒数                     | #6C63FF |
| `kids_if_then`      | 语句块 | 如果条件成立则执行               | #6C63FF |
| `kids_if_else`      | 语句块 | 如果条件成立则执行，否则执行其他 | #6C63FF |

### 变量类积木

| 积木名称               | 类型   | 功能描述           | 颜色    |
| ---------------------- | ------ | ------------------ | ------- |
| `kids_set_variable`    | 语句块 | 设置变量值         | #2D9CDB |
| `kids_change_variable` | 语句块 | 修改变量值（增减） | #2D9CDB |
| `kids_get_variable`    | 值块   | 获取变量值         | #2D9CDB |

### 逻辑类积木

| 积木名称       | 类型 | 功能描述          | 颜色    |
| -------------- | ---- | ----------------- | ------- |
| `kids_compare` | 值块 | 比较两个值        | #F2C94C |
| `kids_boolean` | 值块 | 布尔值 true/false | #F2C94C |
| `kids_and`     | 值块 | 逻辑与运算        | #F2C94C |
| `kids_or`      | 值块 | 逻辑或运算        | #F2C94C |
| `kids_not`     | 值块 | 逻辑非运算        | #F2C94C |

## 颜色规范

### 主色调

- **控制类**: `#6C63FF` (紫色)
- **变量类**: `#2D9CDB` (蓝色)
- **逻辑类**: `#F2C94C` (黄色)

### 辅助色

- **高亮色**: `#846BFF` (深紫色)
- **中性色**: `#E9F0FF` (浅蓝灰)

## 代码生成规范

### Python 代码生成

- 使用 2 空格缩进
- 变量名使用下划线命名法
- 函数名使用下划线命名法

### JavaScript 代码生成

- 使用 2 空格缩进
- 变量名使用驼峰命名法
- 函数名使用驼峰命名法

## 扩展指南

### 添加新积木

1. 在对应的 `blocks/*.ts` 文件中定义积木
2. 在 `registerBlocks.ts` 中注册积木
3. 更新此文档的积木清单
4. 添加相应的代码生成逻辑

### 积木定义模板

```typescript
Blockly.Blocks['kids_new_block'] = {
  init() {
    this.jsonInit({
      type: 'kids_new_block',
      message0: '新积木 %1',
      args0: [
        {
          type: 'input_value',
          name: 'VALUE',
        },
      ],
      previousStatement: null,
      nextStatement: null,
      colour: blockPalette.control,
      tooltip: '新积木的描述',
    });
  },
};
```

## 测试规范

### 单元测试

- 每个积木都应该有对应的测试用例
- 测试积木的 JSON 定义是否正确
- 测试代码生成是否正确

### 集成测试

- 测试积木在工具箱中的显示
- 测试积木的拖拽和连接
- 测试积木的代码生成
