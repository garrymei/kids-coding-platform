import { spawn } from 'child_process';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

/**
 * Docker 容器执行器
 * 提供安全的代码执行环境
 */
export class DockerRunner {
  private readonly imageName = 'kids-code-python:latest';
  private readonly containerTimeout = 5000; // 5秒容器超时
  private readonly resourceLimits = {
    memory: '128m',
    cpus: '0.5',
    pidsLimit: 64
  };

  /**
   * 执行 Python 代码
   */
  async run(input: {
    source: string;
    stdin?: string;
    timeoutMs?: number;
    allowedModules?: string[];
    cpuSeconds?: number;
    memoryLimitBytes?: number;
  }): Promise<{
    stdout?: string;
    stderr?: string;
    exitCode?: number;
    timedOut?: boolean;
    durationMs?: number;
    error?: string;
  }> {
    const startTime = Date.now();
    const timeoutMs = Math.min(input.timeoutMs || 3000, 10000); // 最大10秒
    
    try {
      // 创建临时目录和文件
      const tempDir = this.createTempDirectory();
      const codeFile = join(tempDir, 'code.py');
      const inputFile = join(tempDir, 'input.txt');
      
      // 写入代码文件
      writeFileSync(codeFile, input.source, 'utf8');
      
      // 写入输入文件（如果有）
      if (input.stdin) {
        writeFileSync(inputFile, input.stdin, 'utf8');
      }

      // 构建 Docker 命令
      const dockerArgs = this.buildDockerArgs(tempDir, codeFile, inputFile);
      
      // 执行 Docker 容器
      const result = await this.executeContainer(dockerArgs, timeoutMs);
      
      // 清理临时文件
      this.cleanupTempDirectory(tempDir);
      
      return {
        ...result,
        durationMs: Date.now() - startTime
      };
      
    } catch (error) {
      return {
        stdout: '',
        stderr: error instanceof Error ? error.message : String(error),
        exitCode: 1,
        timedOut: false,
        durationMs: Date.now() - startTime,
        error: 'Container execution failed'
      };
    }
  }

  /**
   * 构建 Docker 运行参数
   */
  private buildDockerArgs(tempDir: string, codeFile: string, inputFile: string): string[] {
    return [
      'run',
      '--rm',                    // 自动删除容器
      '--network', 'none',       // 禁用网络
      '--memory', this.resourceLimits.memory,  // 内存限制
      '--cpus', this.resourceLimits.cpus,      // CPU 限制
      '--pids-limit', this.resourceLimits.pidsLimit.toString(), // 进程数限制
      '--read-only',             // 只读文件系统
      '--tmpfs', '/tmp:rw,size=10m', // 临时文件系统
      '--tmpfs', '/var/tmp:rw,size=5m',
      '--user', 'sandbox',       // 非 root 用户
      '--workdir', '/sandbox',   // 工作目录
      '-v', `${tempDir}:/sandbox:ro`, // 挂载代码目录（只读）
      this.imageName,
      'python3', '-c', this.wrapCode(codeFile)
    ];
  }

  /**
   * 包装用户代码，添加安全检查和输入处理
   */
  private wrapCode(codeFile: string): string {
    return `
import sys
import os
import signal
import time
from pathlib import Path

# 设置超时处理
def timeout_handler(signum, frame):
    print("Execution timeout", file=sys.stderr)
    sys.exit(124)

signal.signal(signal.SIGALRM, timeout_handler)
signal.alarm(3)  # 3秒超时

try:
    # 读取输入文件
    input_file = Path('/sandbox/input.txt')
    if input_file.exists():
        with open(input_file, 'r') as f:
            sys.stdin = f
            exec(open('/sandbox/code.py').read())
    else:
        exec(open('/sandbox/code.py').read())
        
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)
finally:
    signal.alarm(0)  # 取消超时
`;
  }

  /**
   * 执行 Docker 容器
   */
  private async executeContainer(dockerArgs: string[], timeoutMs: number): Promise<{
    stdout: string;
    stderr: string;
    exitCode: number;
    timedOut: boolean;
  }> {
    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';
      let timedOut = false;
      
      const docker = spawn('docker', dockerArgs, {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      // 设置超时
      const timeout = setTimeout(() => {
        timedOut = true;
        docker.kill('SIGKILL');
        resolve({
          stdout: '',
          stderr: 'Execution timeout',
          exitCode: 124,
          timedOut: true
        });
      }, timeoutMs);

      // 收集输出
      docker.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      docker.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      // 处理退出
      docker.on('close', (code, signal) => {
        clearTimeout(timeout);
        
        if (timedOut) {
          return; // 已经在超时处理中 resolve
        }

        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: code || 0,
          timedOut: false
        });
      });

      docker.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  /**
   * 创建临时目录
   */
  private createTempDirectory(): string {
    const tempDir = join(tmpdir(), `sandbox-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    mkdirSync(tempDir, { recursive: true });
    return tempDir;
  }

  /**
   * 清理临时目录
   */
  private cleanupTempDirectory(tempDir: string): void {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to cleanup temp directory:', error);
    }
  }

  /**
   * 检查 Docker 是否可用
   */
  async isAvailable(): Promise<boolean> {
    try {
      const docker = spawn('docker', ['version', '--format', '{{.Server.Version}}'], {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          docker.kill();
          resolve(false);
        }, 3000);

        docker.on('close', (code) => {
          clearTimeout(timeout);
          resolve(code === 0);
        });

        docker.on('error', () => {
          clearTimeout(timeout);
          resolve(false);
        });
      });
    } catch {
      return false;
    }
  }

  /**
   * 检查镜像是否存在
   */
  async isImageAvailable(): Promise<boolean> {
    try {
      const docker = spawn('docker', ['images', '-q', this.imageName], {
        stdio: ['ignore', 'pipe', 'pipe']
      });

      return new Promise((resolve) => {
        let output = '';
        
        docker.stdout?.on('data', (data) => {
          output += data.toString();
        });

        docker.on('close', (code) => {
          resolve(code === 0 && output.trim().length > 0);
        });

        docker.on('error', () => {
          resolve(false);
        });
      });
    } catch {
      return false;
    }
  }
}

// 导出单例实例
export const dockerRunner = new DockerRunner();
