import { useCallback, useEffect, useMemo, useState } from 'react';
import * as Blockly from 'blockly';
// Dynamic imports for language generators
// import 'blockly/python';
// import 'blockly/javascript';
import { BlocklyWorkspace, createCodeGenerator } from '@kids/blockly-extensions';
import { Badge, Button, Card } from '@kids/ui-kit';
import { useCodeExecution, type RunStatus } from '../hooks/useCodeExecution';
import { useWebSocket } from '../hooks/useWebSocket';
import { config } from '@kids/config';

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

export function LabPage() {
  const [workspace, setWorkspace] = useState<Blockly.WorkspaceSvg | null>(null);
  const [pythonCode, setPythonCode] = useState('');
  const [libsLoaded, setLibsLoaded] = useState(false);

  // Load language generation libraries dynamically
  useEffect(() => {
    Promise.all([import('blockly/python'), import('blockly/javascript')]).then(() => {
      setLibsLoaded(true);
    });
  }, []);

  const generator = useMemo(() => {
    if (!libsLoaded) return null;
    return createCodeGenerator(Blockly);
  }, [libsLoaded]);

  const { execute, reset, status, consoleText, rewardMessage, jobId, setConsoleText } =
    useCodeExecution(generator);
  const { connect, disconnect } = useWebSocket();

  useEffect(() => {
    if (jobId) {
      const url = `${config.executor.wsUrl.replace(/\/$/, '')}/run-results/${encodeURIComponent(jobId)}`;
      connect(url, {
        onOpen: () => setConsoleText((prev) => `${prev}\n[ws] Connected to ${url}`),
        onMessage: (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload?.type === 'run-result') {
              const message = Array.isArray(payload?.payload?.stdout)
                ? payload.payload.stdout.join('\n')
                : String(payload?.payload?.stdout ?? 'Sandbox replied');
              setConsoleText((prev) => `${prev}\n[ws] ${message}`);
            } else if (payload?.type === 'error') {
              setConsoleText((prev) => `${prev}\n[ws-error] ${payload?.payload?.message ?? 'Unknown'}`);
            }
          } catch (error) {
            setConsoleText((prev) => `${prev}\n[ws-error] ${(error as Error).message}`);
          }
        },
        onError: () => setConsoleText((prev) => `${prev}\n[ws-error] Connection error`),
        onClose: () => setConsoleText((prev) => `${prev}\n[ws] Connection closed`),
      });
    }

    return () => {
      disconnect();
    };
  }, [jobId, connect, disconnect, setConsoleText]);

  const handleWorkspaceChange = useCallback(
    (ws: Blockly.WorkspaceSvg) => {
      setWorkspace(ws);
      if (generator) {
        try {
          setPythonCode(generator.toPython(ws));
        } catch (error) {
          // Errors during generation are handled by the execution hook if attempted
        }
      }
    },
    [generator],
  );

  const handleExecute = useCallback(() => {
    execute(workspace);
  }, [execute, workspace]);

  const handleClearWorkspace = useCallback(() => {
    reset(workspace);
    setPythonCode('');
  }, [reset, workspace]);

  return (
    <div className="lab-grid">
      <section className="lab-grid__workspace">
        <div className="lab-grid__toolbar">
          <h2>Lab</h2>
          <Badge tone={statusTone[status]} text={statusLabel[status]} />
          <Button onClick={handleExecute} disabled={!libsLoaded}>
            Run Code
          </Button>
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

export default LabPage;
