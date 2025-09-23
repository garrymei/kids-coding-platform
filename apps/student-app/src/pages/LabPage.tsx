import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Blockly from 'blockly';
import 'blockly/python';
import 'blockly/javascript';
import { BlocklyWorkspace, createCodeGenerator } from '@kids/blockly-extensions';
import { Badge, Button, Card } from '@kids/ui-kit';

type RunStatus = 'idle' | 'running' | 'success' | 'error';

type ExecuteResponse = {
  jobId: string;
  ok: boolean;
  results?: Array<{
    stdout?: string;
    stderr?: string;
    exitCode?: number | null;
    timedOut?: boolean;
    durationMs?: number;
    usage?: { cpuSeconds?: number; memoryBytes?: number };
  }>;
  error?: unknown;
};

const statusTone: Record<RunStatus, 'info' | 'warning' | 'success' | 'danger'> = {
  idle: 'info',
  running: 'warning',
  success: 'success',
  error: 'danger',
};

const statusLabel: Record<RunStatus, string> = {
  idle: 'Ready',
  running: 'Running…',
  success: 'Completed',
  error: 'Error',
};

const EXECUTOR_HTTP_URL =
  import.meta.env.VITE_EXECUTOR_HTTP_URL ??
  import.meta.env.VITE_EXECUTOR_URL ??
  'http://localhost:4060/execute';

const EXECUTOR_WS_BASE = import.meta.env.VITE_EXECUTOR_WS_URL ?? 'ws://localhost:4070';

export function LabPage() {
  const [workspace, setWorkspace] = useState<Blockly.WorkspaceSvg | null>(null);
  const [pythonCode, setPythonCode] = useState('');
  const [consoleText, setConsoleText] = useState(
    'Build your blocks on the left and click “Run Code” to send them to the sandbox.',
  );
  const [status, setStatus] = useState<RunStatus>('idle');
  const [rewardMessage, setRewardMessage] = useState<string | null>(null);
  const generator = useMemo(() => createCodeGenerator(Blockly), []);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => () => {
    wsRef.current?.close();
  }, []);

  const handleWorkspaceChange = useCallback(
    (ws: Blockly.WorkspaceSvg) => {
      setWorkspace(ws);
      try {
        setPythonCode(generator.toPython(ws));
        setStatus('idle');
        setRewardMessage(null);
      } catch (error) {
        setStatus('error');
        setConsoleText(error instanceof Error ? error.message : String(error));
      }
    },
    [generator],
  );

  const connectToWebSocket = useCallback((jobId: string) => {
    if (!jobId) return;
    const base = EXECUTOR_WS_BASE.replace(/\/$/, '');
    const url = `${base}/run-results/${encodeURIComponent(jobId)}`;

    try {
      wsRef.current?.close();
      const socket = new WebSocket(url);
      wsRef.current = socket;

      socket.onopen = () => {
        setConsoleText((prev) => `${prev}\n[ws] Connected to ${url}`);
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload?.type === 'run-result') {
            const message = Array.isArray(payload?.payload?.stdout)
              ? payload.payload.stdout.join('\n')
              : String(payload?.payload?.stdout ?? 'Sandbox replied');
            setConsoleText((prev) => `${prev}\n[ws] ${message}`);
            setStatus('success');
          } else if (payload?.type === 'error') {
            setConsoleText((prev) => `${prev}\n[ws-error] ${payload?.payload?.message ?? 'Unknown'}`);
            setStatus('error');
          }
        } catch (error) {
          setConsoleText((prev) => `${prev}\n[ws-error] ${(error as Error).message}`);
        }
      };

      socket.onerror = () => {
        setConsoleText((prev) => `${prev}\n[ws-error] Connection error`);
      };

      socket.onclose = () => {
        setConsoleText((prev) => `${prev}\n[ws] Connection closed`);
      };
    } catch (error) {
      setConsoleText((prev) => `${prev}\n[ws-error] ${(error as Error).message}`);
    }
  }, []);

  const handleExecute = useCallback(async () => {
    if (!workspace) {
      setStatus('error');
      setConsoleText('Please build blocks on the left before running.');
      return;
    }

    try {
      const latestCode = generator.toPython(workspace);
      setPythonCode(latestCode);
      setStatus('running');
      setConsoleText('Submitting code to executor…');
      setRewardMessage(null);

      const response = await fetch(EXECUTOR_HTTP_URL, {
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
          setRewardMessage(null);
        } else if (firstResult.stderr) {
          setStatus('error');
          setConsoleText(output);
          setRewardMessage(null);
        } else {
          setStatus('success');
          setConsoleText(output);
          setRewardMessage('🎉 Great job! +20 XP (placeholder reward animation)');
        }
      } else {
        setStatus('error');
        setConsoleText('Executor returned no results.');
        setRewardMessage(null);
      }

      if (data.jobId) {
        connectToWebSocket(data.jobId);
      }
    } catch (error) {
      setStatus('error');
      setConsoleText(error instanceof Error ? error.message : String(error));
      setRewardMessage(null);
    }
  }, [connectToWebSocket, generator, workspace]);

  const handleClearWorkspace = useCallback(() => {
    wsRef.current?.close();
    workspace?.clear();
    setPythonCode('');
    setConsoleText('Workspace cleared.');
    setStatus('idle');
    setRewardMessage(null);
  }, [workspace]);

  return (
    <div className="lab-grid">
      <section className="lab-grid__workspace">
        <div className="lab-grid__toolbar">
          <h2>Lab</h2>
          <Badge tone={statusTone[status]} text={statusLabel[status]} />
          <Button onClick={handleExecute}>Run Code</Button>
        </div>
        <div className="lab-grid__canvas">
          <BlocklyWorkspace onWorkspaceChange={handleWorkspaceChange} height={520} />
        </div>
      </section>

      <section className="lab-grid__side">
        <Card heading="Task Hint">
          <p>Use a loop to light up bulbs #1 to #5, then click “Run Code”.</p>
          <ul className="reminder-list">
            <li>Keep variable names short and readable (e.g. <code>index</code>).</li>
            <li>Try adding a <code>wait</code> block inside the loop to visualise timing.</li>
          </ul>
        </Card>

        <Card heading="Generated Python">
          <pre className="code-preview">
{pythonCode || '# Blocks will automatically turn into Python here'}
          </pre>
        </Card>

        <Card heading="Console">
          <div className="console-panel">{consoleText}</div>
        </Card>

        {rewardMessage ? (
          <Card heading="Reward">
            <p>{rewardMessage}</p>
          </Card>
        ) : null}

        <div className="lab-grid__actions">
          <Button variant="secondary" onClick={handleClearWorkspace}>
            Clear Workspace
          </Button>
        </div>
      </section>
    </div>
  );
}
