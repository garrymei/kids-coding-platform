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
  allowedModules: string[];
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
      return runPythonTestSequential(source, tests, {
        timeoutMs: this.options.executionTimeoutMs,
        allowedModules: this.options.allowedModules,
        cpuSeconds: Math.max(1, Math.ceil(this.options.executionTimeoutMs / 1_000)),
        memoryLimitBytes: this.options.memoryBytes,
      });
    }

    const taskList = tests.length ? tests : [{}];

    for (const [index, test] of taskList.entries()) {
      const start = Date.now();
      const result = await this.runInContainer(
        {
          source,
          stdin: test.stdin,
          timeoutMs: test.timeoutMs ?? this.options.executionTimeoutMs,
        },
        execLogger,
        index,
      );
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
        durationMs: result.durationMs,
        raw: undefined,
        expectedStdout: test.expectedStdout,
        passed,
        containerId: result.containerId,
        svg: result.svg,
        segments: result.segments,
      });
    }

    return results;
  }

  private async runInContainer(
    { source, stdin, timeoutMs }: DockerExecutionRequest,
    log = logger,
    testIndex = 0,
  ): Promise<
    DockerExecutionResult & { svg?: string; segments?: Array<{ len: number; deg: number }> }
  > {
    const startedAt = Date.now();
    const timeout = Math.max(500, timeoutMs ?? this.options.executionTimeoutMs);

    const container = await this.docker.createContainer({
      Image: this.options.image,
      // Read JSON input from file via shell redirection to avoid stdin attach issues
      Cmd: ['sh', '-lc', 'python python_runner.py < input.json'],
      WorkingDir: '/opt',
      OpenStdin: false,
      StdinOnce: false,
      AttachStdout: true,
      AttachStderr: true,
      AttachStdin: false,
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

    // Add files directly to /opt
    pack.entry({ name: 'main.py', mode: 0o644 }, source);

    // Copy turtle.py module to container for turtle_artist games
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const turtlePath = path.resolve(__dirname, './runtime/turtle.py');
      const turtleContent = await fs.readFile(turtlePath, 'utf8');
      pack.entry({ name: 'turtle.py', mode: 0o644 }, turtleContent);
    } catch (error) {
      log.warn(
        'Failed to copy turtle.py to container: %s',
        error instanceof Error ? error.message : String(error),
      );
    }

    // Copy python_runner.py to container
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const runnerPath = path.resolve(__dirname, './runtime/python_runner.py');
      const runnerContent = await fs.readFile(runnerPath, 'utf8');
      pack.entry({ name: 'python_runner.py', mode: 0o644 }, runnerContent);
    } catch (error) {
      log.warn(
        'Failed to copy python_runner.py to container: %s',
        error instanceof Error ? error.message : String(error),
      );
    }

    // Prepare JSON input file to avoid stdin streaming
    const input = JSON.stringify({ source, stdin: stdin || '' });
    pack.entry({ name: 'input.json', mode: 0o644 }, input);
    pack.finalize();

    // Put archive to /opt - files will be extracted directly to /opt
    await container.putArchive(pack, { path: '/opt' });

    // Attach only stdout/stderr; stdin is handled via input.json
    const stream = await container.attach({
      stream: true,
      stdout: true,
      stderr: true,
      stdin: false,
    });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    const stdoutStream = new PassThrough();
    const stderrStream = new PassThrough();

    this.docker.modem.demuxStream(stream, stdoutStream, stderrStream);

    stdoutStream.on('data', (chunk) => {
      log.info({ msg: 'stdout_chunk_received', chunkLength: chunk.length, testIndex });
      stdoutChunks.push(chunk as Buffer);
    });
    stderrStream.on('data', (chunk) => {
      log.info({ msg: 'stderr_chunk_received', chunkLength: chunk.length, testIndex });
      stderrChunks.push(chunk as Buffer);
    });

    // Log prepared input length for traceability
    log.info({
      msg: 'prepared_input_file',
      containerId: container.id,
      inputLength: input.length,
      testIndex,
    });

    // Start container first
    await container.start();

    log.info({
      msg: 'container_execution_started',
      containerId: container.id,
      timeoutMs: timeout,
      testIndex,
    });

    // No stdin writing; input is read from file by shell redirection

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

    // Parse turtle output from stdout
    let svg: string | undefined;
    let segments: Array<{ len: number; deg: number }> | undefined;

    try {
      // Look for JSON output in stdout
      const lines = stdout.split('\n');
      for (const line of lines) {
        if (line.trim().startsWith('{') && line.trim().endsWith('}')) {
          try {
            const parsed = JSON.parse(line.trim());
            if (parsed.svg) {
              svg = parsed.svg;
            }
            if (parsed.segments) {
              segments = parsed.segments;
            }
            break;
          } catch (e) {
            // Continue to next line
          }
        }
      }
    } catch (error) {
      // Ignore parsing errors
    }

    return {
      stdout,
      stderr,
      exitCode: outcome.StatusCode,
      timedOut,
      signal: null,
      containerId: container.id,
      durationMs: Date.now() - startedAt,
      svg,
      segments,
    };
  }
}

async function runPythonTestSequential(
  source: string,
  tests: BatchTestInput[],
  options: {
    timeoutMs: number;
    allowedModules: string[];
    cpuSeconds: number;
    memoryLimitBytes: number;
  },
): Promise<BatchTestResult[]> {
  const tasks = tests.length ? tests : [{}];
  const results: BatchTestResult[] = [];
  for (const test of tasks) {
    const res = await runPythonTest({
      source,
      stdin: test.stdin,
      timeoutMs: test.timeoutMs ?? options.timeoutMs,
      allowedModules: options.allowedModules,
      cpuSeconds: options.cpuSeconds,
      memoryLimitBytes: options.memoryLimitBytes,
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
