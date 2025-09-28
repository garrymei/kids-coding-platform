import { useCallback, useState } from 'react';
import type * as Blockly from 'blockly';
import type { CodeGenerator } from '@kids/blockly-extensions';

import { config } from '@kids/config';


export type RunStatus = 'idle' | 'running' | 'success' | 'error';

export type ExecuteResponse = {
  jobId: string;
  ok: boolean;
  results?: Array<{ stdout?: string; stderr?: string; exitCode?: number | null; timedOut?: boolean; durationMs?: number; usage?: { cpuSeconds?: number; memoryBytes?: number } }>;
  error?: unknown;
};

export function useCodeExecution(generator: CodeGenerator | null) {
  const [status, setStatus] = useState<RunStatus>('idle');
  const [consoleText, setConsoleText] = useState(
    'Build your blocks on the left and click “Run Code” to send them to the sandbox.',
  );
  const [rewardMessage, setRewardMessage] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  const execute = useCallback(
    async (workspace: Blockly.WorkspaceSvg | null) => {
      if (!workspace || !generator) {
        setStatus('error');
        setConsoleText('Please build blocks on the left before running.');
        return;
      }

      try {
        const latestCode = generator.toPython(workspace);
        setStatus('running');
        setConsoleText('Submitting code to executor…');
        setRewardMessage(null);
        setJobId(null);

        const response = await fetch(config.executor.httpUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            language: 'python',
            source: latestCode,
            tests: [{ stdin: '' }],
          }),
        });

        if (!response.ok) {
          setStatus('error');
          setConsoleText(`Executor responded with HTTP ${response.status}`);
          return;
        }

        const data = (await response.json()) as ExecuteResponse;
        if (data.jobId) {
          setJobId(data.jobId);
        }

        if (!data.ok) {
          setStatus('error');
          setConsoleText(String(data.error ?? 'Execution failed'));
          return;
        }

        const firstResult = data.results?.[0];
        if (firstResult) {
          const output = firstResult.stdout?.trim() || firstResult.stderr || 'No stdout captured';
          if (firstResult.timedOut) {
            setStatus('error');
            setConsoleText(`⏱️ Timed out after ${firstResult.durationMs ?? 0} ms\n${output}`);
          } else if (firstResult.stderr) {
            setStatus('error');
            setConsoleText(output);
          } else {
            setStatus('success');
            setConsoleText(output);
            setRewardMessage('🎉 Great job! +20 XP (placeholder reward animation)');
          }
        } else {
          setStatus('error');
          setConsoleText('Executor returned no results.');
        }
      } catch (error) {
        setStatus('error');
        setConsoleText(error instanceof Error ? error.message : String(error));
      }
    },
    [generator],
  );

  const reset = useCallback((workspace: Blockly.WorkspaceSvg | null) => {
    workspace?.clear();
    setConsoleText('Workspace cleared.');
    setStatus('idle');
    setRewardMessage(null);
    setJobId(null);
  }, []);

  return { execute, reset, status, consoleText, rewardMessage, jobId, setConsoleText };
}
