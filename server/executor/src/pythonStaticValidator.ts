import { spawn } from 'child_process';
import path from 'path';

export interface StaticAnalysisResult {
  ok: boolean;
  issues: string[];
}

export async function validatePythonSource(
  source: string,
  allowedModules: string[],
  timeoutMs = 1500,
): Promise<StaticAnalysisResult> {
  const checkerPath = path.resolve(__dirname, '../src/runtime/python_static_checker.py');
  const candidates = [process.env.PYTHON_BIN, 'python3', 'python'].filter(
    (value): value is string => Boolean(value),
  );

  let lastError: Error | undefined;

  for (const binary of candidates) {
    try {
      return await runAnalysis(binary, checkerPath, source, allowedModules, timeoutMs);
    } catch (error) {
      lastError = error as Error;
      const err = error as { code?: string };
      if (err?.code !== 'ENOENT') {
        break;
      }
    }
  }

  throw lastError ?? new Error('Unable to locate python interpreter for static analysis');
}

function runAnalysis(
  pythonBinary: string,
  checkerPath: string,
  source: string,
  allowedModules: string[],
  timeoutMs: number,
): Promise<StaticAnalysisResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(pythonBinary, [checkerPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('Static analysis timed out'));
    }, timeoutMs);

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0 && stderr) {
        reject(new Error(`Static checker exited with code ${code}: ${stderr}`));
        return;
      }
      try {
        const result = JSON.parse(stdout || '{}');
        resolve({
          ok: Boolean(result.ok),
          issues: Array.isArray(result.issues) ? result.issues.map(String) : [],
        });
      } catch (error) {
        reject(error);
      }
    });

    child.stdin.write(
      JSON.stringify({
        source,
        allowedModules,
      }),
    );
    child.stdin.end();
  });
}
