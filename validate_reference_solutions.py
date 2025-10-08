#!/usr/bin/env python3
"""
参考答案验证脚本
用于验证所有游戏关卡的参考答案输出是否与期望结果一致
"""

import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Dict, List, Tuple, Any

class ReferenceAnswerValidator:
    def __init__(self, levels_dir: str):
        self.levels_dir = Path(levels_dir)
        self.errors = []
        self.validated_count = 0
        
    def find_all_level_files(self) -> List[Path]:
        """查找所有关卡JSON文件"""
        level_files = []
        for game_type in ['io', 'led', 'maze', 'music', 'pixel']:
            game_dir = self.levels_dir / 'python' / game_type / 'levels'
            if game_dir.exists():
                level_files.extend(game_dir.rglob('*.json'))
        return level_files
    
    def load_level_config(self, level_file: Path) -> Dict[str, Any]:
        """加载关卡配置"""
        try:
            with open(level_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            self.errors.append(f"无法加载关卡文件 {level_file}: {e}")
            return {}
    
    def execute_python_code(self, code: str, input_data: str = "") -> Tuple[str, str]:
        """执行Python代码并返回输出和错误"""
        try:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, encoding='utf-8') as f:
                f.write("# -*- coding: utf-8 -*-\n" + code)
                temp_file = f.name
            
            process = subprocess.run(
                [sys.executable, temp_file],
                input=input_data,
                capture_output=True,
                text=True,
                timeout=10
            )
            
            os.unlink(temp_file)
            return process.stdout, process.stderr
            
        except subprocess.TimeoutExpired:
            return "", "代码执行超时"
        except Exception as e:
            return "", f"执行错误: {e}"
    
    def validate_io_level(self, level_config: Dict[str, Any], level_file: Path) -> bool:
        """验证IO类型关卡"""
        solution = level_config.get('solution', '')
        if not solution:
            self.errors.append(f"{level_file}: 缺少solution字段")
            return False
        
        grader = level_config.get('grader', {})
        if grader.get('mode') != 'io':
            return True  # 非IO模式，跳过
        
        io_cases = grader.get('io', {}).get('cases', [])
        if not io_cases:
            self.errors.append(f"{level_file}: 缺少测试用例")
            return False
        
        all_passed = True
        for i, case in enumerate(io_cases):
            input_data = case.get('in', '')
            expected_output = case.get('out', '')
            
            actual_output, error = self.execute_python_code(solution, input_data)
            
            if error:
                self.errors.append(f"{level_file}: 用例{i+1}执行错误: {error}")
                all_passed = False
                continue
            
            if actual_output != expected_output:
                self.errors.append(
                    f"{level_file}: 用例{i+1}输出不匹配\n"
                    f"期望: {repr(expected_output)}\n"
                    f"实际: {repr(actual_output)}"
                )
                all_passed = False
        
        return all_passed
    
    def validate_pixel_level(self, level_config: Dict[str, Any], level_file: Path) -> bool:
        """验证Pixel类型关卡"""
        return self.validate_io_level(level_config, level_file)  # Pixel使用IO模式
    
    def validate_music_level(self, level_config: Dict[str, Any], level_file: Path) -> bool:
        """验证Music类型关卡"""
        solution = level_config.get('solution', '')
        if not solution:
            self.errors.append(f"{level_file}: 缺少solution字段")
            return False
        
        grader = level_config.get('grader', {})
        if grader.get('mode') != 'music':
            return True  # 非Music模式，跳过
        
        # Music关卡通常有特定的验证逻辑，这里先检查代码能否正常执行
        _, error = self.execute_python_code(solution)
        if error:
            self.errors.append(f"{level_file}: Music关卡代码执行错误: {error}")
            return False
        
        return True
    
    def validate_maze_level(self, level_config: Dict[str, Any], level_file: Path) -> bool:
        """验证Maze类型关卡"""
        solution = level_config.get('solution', '')
        if not solution:
            self.errors.append(f"{level_file}: 缺少solution字段")
            return False
        
        grader = level_config.get('grader', {})
        if grader.get('mode') != 'maze':
            return True  # 非Maze模式，跳过
        
        # Maze关卡通常有特定的验证逻辑，这里先检查代码能否正常执行
        _, error = self.execute_python_code(solution)
        if error:
            self.errors.append(f"{level_file}: Maze关卡代码执行错误: {error}")
            return False
        
        return True
    
    def validate_led_level(self, level_config: Dict[str, Any], level_file: Path) -> bool:
        """验证LED类型关卡"""
        solution = level_config.get('solution', '')
        if not solution:
            self.errors.append(f"{level_file}: 缺少solution字段")
            return False
        
        grader = level_config.get('grader', {})
        if grader.get('mode') != 'led':
            return True  # 非LED模式，跳过
        
        # LED关卡通常有特定的验证逻辑，这里先检查代码能否正常执行
        _, error = self.execute_python_code(solution)
        if error:
            self.errors.append(f"{level_file}: LED关卡代码执行错误: {error}")
            return False
        
        return True
    
    def validate_level(self, level_file: Path) -> bool:
        """验证单个关卡"""
        level_config = self.load_level_config(level_file)
        if not level_config:
            return False
        
        game_type = level_config.get('gameType', '')
        
        if game_type == 'io':
            return self.validate_io_level(level_config, level_file)
        elif game_type == 'pixel':
            return self.validate_pixel_level(level_config, level_file)
        elif game_type == 'music':
            return self.validate_music_level(level_config, level_file)
        elif game_type == 'maze':
            return self.validate_maze_level(level_config, level_file)
        elif game_type == 'led':
            return self.validate_led_level(level_config, level_file)
        else:
            self.errors.append(f"{level_file}: 未知的游戏类型: {game_type}")
            return False
    
    def validate_all(self) -> bool:
        """验证所有关卡"""
        level_files = self.find_all_level_files()
        print(f"找到 {len(level_files)} 个关卡文件")
        
        for level_file in level_files:
            print(f"验证: {level_file.name}")
            if self.validate_level(level_file):
                self.validated_count += 1
            else:
                print(f"  ❌ 验证失败")
        
        return len(self.errors) == 0
    
    def print_report(self):
        """打印验证报告"""
        print("\n" + "="*60)
        print("参考答案验证报告")
        print("="*60)
        print(f"验证成功: {self.validated_count} 个关卡")
        print(f"验证失败: {len(self.errors)} 个关卡")
        
        if self.errors:
            print("\n错误详情:")
            for i, error in enumerate(self.errors, 1):
                print(f"{i}. {error}")
        else:
            print("\n✅ 所有关卡的参考答案都验证通过！")

def main():
    if len(sys.argv) != 2:
        print("用法: python validate_reference_solutions.py <levels_directory>")
        sys.exit(1)
    
    levels_dir = sys.argv[1]
    if not os.path.exists(levels_dir):
        print(f"错误: 目录不存在: {levels_dir}")
        sys.exit(1)
    
    validator = ReferenceAnswerValidator(levels_dir)
    success = validator.validate_all()
    validator.print_report()
    
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()