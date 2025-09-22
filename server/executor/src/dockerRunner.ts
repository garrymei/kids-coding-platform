import Docker from 'dockerode';
import { PassThrough } from 'node:stream';
import tar from 'tar-stream';
import type { BatchTestInput, BatchTestResult } from './pythonExecutor';
import { runPythonTest } from './pythonExecutor';
import { createChildLogger, logger } from './logger';

export interface DockerRunnerOptions {
  socketPath: string;
  image: string;
  memoryBytes: number;
  nanoCpus: number;
  executionTimeoutMs: number;
  allowedModulesJson: string;
  enableLocalFallback: boolean;
}

export interface DockerExecutionRequest {
  source: string;
  stdin?: string;
  timeoutMs?: number;
}

export interface DockerExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  timedOut: boolean;
  signal: string | null;
  containerId?: string;
  durationMs: number;
}

export class DockerExecutor {
  private readonly docker: Docker;

  private readonly options: DockerRunnerOptions;

  constructor(options: DockerRunnerOptions) {
    this.options = options;
    this.docker = new Docker({ socketPath: options.socketPath });
  }

  async ping(): Promise<boolean> {
    try {
      await this.docker.ping();
      return true;
    } catch (error) {
      logger.warn({ err: error }, '[docker] ping failed');
      return false;
    }
  }

  async execBatch(
    source: string,
    tests: BatchTestInput[],
    context?: { traceId: string; userId: string | null; jobId: string },
  ): Promise<BatchTestResult[]> {
    const execLogger = createChildLogger({
      traceId: context?.traceId,
      userId: context?.userId,
      jobId: context?.jobId,
    });

    const results: BatchTestResult[] = [];

    const canUseDocker = await this.ping();
    if (!canUseDocker) {
      if (!this.options.enableLocalFallback) {
        throw new Error('Docker daemon unavailable and local fallback disabled');
      }
      execLogger.warn('[docker] falling back to local executor');
      return runPythonTestSequential(source, tests, this.options.executionTimeoutMs);
    }

    const taskList = tests.length ? tests : [{}];

    for (const [index, test] of taskList.entries()) {
      const start = Date.now();
      const result = await this.runInContainer({
        source,
        stdin: test.stdin,
        timeoutMs: test.timeoutMs ?? this.options.executionTimeoutMs,
      }, execLogger, index);
      const durationMs = Date.now() - start;
      const passed =
        typeof test.expectedStdout === 'string'
          ? result.stdout.trim() === test.expectedStdout.trim()
          : undefined;

      execLogger.info({
        msg: 'container_execution_finished',
        containerId: result.containerId,
        exitCode: result.exitCode,
        durationMs,
        timedOut: result.timedOut,
        testIndex: index,
      });

      results.push({
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        timedOut: result.timedOut,
        signal: result.signal,
        raw: undefined,
        expectedStdout: test.expectedStdout,
        passed,
      });
    }

    return results;
  }

  private async runInContainer(
    { source, stdin, timeoutMs }: DockerExecutionRequest,
    log = logger,
    testIndex = 0,
  ): Promise<DockerExecutionResult> {
    const timeout = Math.max(500, timeoutMs ?? this.options.executionTimeoutMs);

    const container = await this.docker.createContainer({
      Image: this.options.image,
      Cmd: ['python', '/opt/task/main.py'],
      WorkingDir: '/opt/task',
      OpenStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      AttachStdin: true,
      Tty: false,
      HostConfig: {
        AutoRemove: true,
        NetworkMode: 'none',
        Memory: this.options.memoryBytes,
        NanoCpus: this.options.nanoCpus,
        PidsLimit: 128,
        SecurityOpt: ['no-new-privileges:true'],
        ReadonlyRootfs: false,
      },
      Env: [
        `EXECUTOR_TIMEOUT=${timeout / 1000}`,
        `EXECUTOR_ALLOWED_MODULES=${this.options.allowedModulesJson}`,
        `PYTHONUNBUFFERED=1`,
      ],
    });

    const pack = tar.pack();
    pack.entry({ name: 'task/main.py', mode: 0o644 }, source);
    pack.finalize();

    await container.putArchive(pack, { path: '/opt' });

    const stream = await container.attach({ stream: true, stdout: true, stderr: true, stdin: true });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    const stdoutStream = new PassThrough();
    const stderrStream = new PassThrough();

    this.docker.modem.demuxStream(stream, stdoutStream, stderrStream);

    stdoutStream.on('data', (chunk) => stdoutChunks.push(chunk as Buffer));
    stderrStream.on('data', (chunk) => stderrChunks.push(chunk as Buffer));

    await container.start();

    log.info({
      msg: 'container_execution_started',
      containerId: container.id,
      timeoutMs: timeout,
      testIndex,
    });

    if (stdin) {
      stream.write(stdin);
    }
    stream.end();

    let timedOut = false;
    const timer = setTimeout(async () => {
      timedOut = true;
      try {
        await container.kill();
      } catch (error) {
        log.warn({ err: error, containerId: container.id }, 'container_kill_failed');
      }
      log.warn({
        msg: 'container_execution_timeout',
        containerId: container.id,
        timeoutMs: timeout,
        testIndex,
      });
    }, timeout + 250);

    const outcome = await container.wait().finally(() => clearTimeout(timer));

    const stdout = Buffer.concat(stdoutChunks).toString();
    const stderr = Buffer.concat(stderrChunks).toString();

    return {
      stdout,
      stderr,
      exitCode: outcome.StatusCode,
      timedOut,
      signal: null,
      containerId: container.id,
      durationMs: timeout, // approximate, actual logged elsewhere
    };
  }
}

async function runPythonTestSequential(
  source: string,
  tests: BatchTestInput[],
  defaultTimeout: number,
): Promise<BatchTestResult[]> {
  const tasks = tests.length ? tests : [{}];
  const results: BatchTestResult[] = [];
  for (const test of tasks) {
    const res = await runPythonTest({
      source,
      stdin: test.stdin,
      timeoutMs: test.timeoutMs ?? defaultTimeout,
    });
    const passed =
      typeof test.expectedStdout === 'string'
        ? res.stdout.trim() === test.expectedStdout.trim()
        : undefined;
    results.push({
      ...res,
      expectedStdout: test.expectedStdout,
      passed,
    });
  }
  return results;
}
