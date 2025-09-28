/**
 * Docker 容器安全测试
 * 验证容器隔离和资源限制
 */

const { spawn } = require('child_process');
const { writeFileSync, mkdirSync, rmSync } = require('fs');
const { join } = require('path');
const { tmpdir } = require('os');

class SecurityTester {
  constructor() {
    this.imageName = 'kids-code-python:latest';
    this.testResults = [];
  }

  /**
   * 运行安全测试
   */
  async runAllTests() {
    console.log('🔒 开始 Docker 容器安全测试...\n');

    const tests = [
      { name: '系统命令执行测试', test: this.testSystemCommand.bind(this) },
      { name: '死循环超时测试', test: this.testInfiniteLoop.bind(this) },
      { name: '内存炸弹测试', test: this.testMemoryBomb.bind(this) },
      { name: '网络访问测试', test: this.testNetworkAccess.bind(this) },
      { name: '文件系统写入测试', test: this.testFileSystemWrite.bind(this) },
      { name: '并发执行测试', test: this.testConcurrentExecution.bind(this) }
    ];

    for (const { name, test } of tests) {
      try {
        console.log(`🧪 运行测试: ${name}`);
        const result = await test();
        this.testResults.push({ name, result, passed: result.passed });
        console.log(result.passed ? '✅ 通过' : '❌ 失败');
        console.log(`   详情: ${result.message}\n`);
      } catch (error) {
        this.testResults.push({ name, result: { passed: false, message: error.message }, passed: false });
        console.log('❌ 测试异常');
        console.log(`   错误: ${error.message}\n`);
      }
    }

    this.printSummary();
  }

  /**
   * 测试 1: 系统命令执行
   * 期望: 容器报错，主机无影响
   */
  async testSystemCommand() {
    const maliciousCode = `
import os
try:
    result = os.system('ls /')
    print(f"Command result: {result}")
except Exception as e:
    print(f"Error: {e}")
`;

    const result = await this.runContainer(maliciousCode);
    
    return {
      passed: result.exitCode !== 0 && result.stderr.includes('Error'),
      message: `退出码: ${result.exitCode}, 错误: ${result.stderr.substring(0, 100)}`
    };
  }

  /**
   * 测试 2: 死循环超时
   * 期望: 3s 超时被 kill，不影响主机
   */
  async testInfiniteLoop() {
    const maliciousCode = `
print("Starting infinite loop...")
while True:
    pass
print("This should never print")
`;

    const startTime = Date.now();
    const result = await this.runContainer(maliciousCode, 5000); // 5秒超时
    const duration = Date.now() - startTime;

    return {
      passed: result.timedOut && duration < 6000, // 应该在6秒内被杀死
      message: `超时: ${result.timedOut}, 持续时间: ${duration}ms`
    };
  }

  /**
   * 测试 3: 内存炸弹
   * 期望: 触发 OOMKilled 容器退出，主机稳定
   */
  async testMemoryBomb() {
    const maliciousCode = `
print("Creating memory bomb...")
try:
    data = 'x' * (10**9)  # 1GB 字符串
    print(f"Created {len(data)} characters")
except Exception as e:
    print(f"Memory error: {e}")
`;

    const result = await this.runContainer(maliciousCode);

    return {
      passed: result.exitCode === 137 || result.stderr.includes('Memory') || result.timedOut,
      message: `退出码: ${result.exitCode}, 错误: ${result.stderr.substring(0, 100)}`
    };
  }

  /**
   * 测试 4: 网络访问
   * 期望: 网络被禁用，无法访问外部资源
   */
  async testNetworkAccess() {
    const maliciousCode = `
import urllib.request
try:
    response = urllib.request.urlopen('http://www.google.com')
    print("Network access successful!")
except Exception as e:
    print(f"Network error: {e}")
`;

    const result = await this.runContainer(maliciousCode);

    return {
      passed: result.exitCode !== 0 && (result.stderr.includes('Network') || result.stderr.includes('Connection')),
      message: `退出码: ${result.exitCode}, 错误: ${result.stderr.substring(0, 100)}`
    };
  }

  /**
   * 测试 5: 文件系统写入
   * 期望: 只读文件系统，无法写入
   */
  async testFileSystemWrite() {
    const maliciousCode = `
try:
    with open('/etc/test.txt', 'w') as f:
        f.write('malicious content')
    print("File write successful!")
except Exception as e:
    print(f"File write error: {e}")
`;

    const result = await this.runContainer(maliciousCode);

    return {
      passed: result.exitCode !== 0 && result.stderr.includes('File write error'),
      message: `退出码: ${result.exitCode}, 错误: ${result.stderr.substring(0, 100)}`
    };
  }

  /**
   * 测试 6: 并发执行
   * 期望: 每个容器独立运行，互不影响
   */
  async testConcurrentExecution() {
    const code = `
import time
import random
print(f"Process {random.randint(1000, 9999)} starting...")
time.sleep(1)
print(f"Process {random.randint(1000, 9999)} finished!")
`;

    const promises = Array(5).fill().map(() => this.runContainer(code));
    const results = await Promise.all(promises);

    const allPassed = results.every(r => r.exitCode === 0 && r.stdout.includes('finished'));
    const uniqueOutputs = new Set(results.map(r => r.stdout.trim()));

    return {
      passed: allPassed && uniqueOutputs.size === 5, // 5个不同的输出
      message: `所有进程完成: ${allPassed}, 唯一输出数: ${uniqueOutputs.size}`
    };
  }

  /**
   * 运行容器
   */
  async runContainer(code, timeoutMs = 10000) {
    const tempDir = this.createTempDirectory();
    const codeFile = join(tempDir, 'code.py');
    
    writeFileSync(codeFile, code, 'utf8');

    const dockerArgs = [
      'run',
      '--rm',
      '--network', 'none',
      '--memory', '128m',
      '--cpus', '0.5',
      '--pids-limit', '64',
      '--read-only',
      '--tmpfs', '/tmp:rw,size=10m',
      '--user', 'sandbox',
      '--workdir', '/sandbox',
      '-v', `${tempDir}:/sandbox:ro`,
      this.imageName,
      'python3', '-c', this.wrapCode(codeFile)
    ];

    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let timedOut = false;

      const docker = spawn('docker', dockerArgs, {
        stdio: ['ignore', 'pipe', 'pipe']
      });

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

      docker.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      docker.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      docker.on('close', (code, signal) => {
        clearTimeout(timeout);
        
        if (timedOut) {
          return;
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
        resolve({
          stdout: '',
          stderr: error.message,
          exitCode: 1,
          timedOut: false
        });
      });
    }).finally(() => {
      this.cleanupTempDirectory(tempDir);
    });
  }

  /**
   * 包装代码
   */
  wrapCode(codeFile) {
    return `
import sys
import os
import signal
import time
from pathlib import Path

def timeout_handler(signum, frame):
    print("Execution timeout", file=sys.stderr)
    sys.exit(124)

signal.signal(signal.SIGALRM, timeout_handler)
signal.alarm(3)

try:
    exec(open('/sandbox/code.py').read())
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)
finally:
    signal.alarm(0)
`;
  }

  /**
   * 创建临时目录
   */
  createTempDirectory() {
    const tempDir = join(tmpdir(), `security-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    mkdirSync(tempDir, { recursive: true });
    return tempDir;
  }

  /**
   * 清理临时目录
   */
  cleanupTempDirectory(tempDir) {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to cleanup temp directory:', error);
    }
  }

  /**
   * 打印测试总结
   */
  printSummary() {
    console.log('📊 安全测试总结:');
    console.log('='.repeat(50));
    
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    
    this.testResults.forEach(({ name, result, passed }) => {
      const status = passed ? '✅' : '❌';
      console.log(`${status} ${name}: ${result.message}`);
    });
    
    console.log('='.repeat(50));
    console.log(`总计: ${passed}/${total} 通过`);
    
    if (passed === total) {
      console.log('🎉 所有安全测试通过！容器环境安全可靠。');
    } else {
      console.log('⚠️  部分测试失败，需要检查容器配置。');
    }
  }
}

// 运行测试
if (require.main === module) {
  const tester = new SecurityTester();
  tester.runAllTests().catch(console.error);
}

module.exports = SecurityTester;
