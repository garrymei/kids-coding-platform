import { useCallback, useEffect, useMemo, useState } from 'react';
import * as Blockly from 'blockly/core';
import 'blockly/python';
import { BlocklyWorkspace } from '@kids/blockly-extensions';
import { Badge, Button, Card, Progress } from '@kids/ui-kit';
import './App.css';

type RunStatus = 'idle' | 'running' | 'success' | 'error';

type ExecutorResponse = {
  ok: boolean;
  jobId?: string;
  results?: Array<{
    stdout: string;
    stderr: string;
    timedOut: boolean;
    exitCode: number | null;
  }>;
  error?: unknown;
};

const EXECUTOR_URL = import.meta.env.VITE_EXECUTOR_URL ?? 'http://localhost:4060/execute';

const statusToneMap: Record<RunStatus, 'info' | 'success' | 'warning' | 'danger'> = {
  idle: 'info',
  running: 'warning',
  success: 'success',
  error: 'danger',
};

const statusLabelMap: Record<RunStatus, string> = {
  idle: '待运行',
  running: '运行中…',
  success: '运行成功',
  error: '运行失败',
};

const demoTaskDescription = `任务提示：使用循环让灯泡编号 1~5 依次点亮。\n· 序号变量从 1 开始\n· 每次循环打印 “灯泡 X 点亮”`; // Show in console panel

function App() {
  const [workspace, setWorkspace] = useState<Blockly.WorkspaceSvg | null>(null);
  const [generatedCode, setGeneratedCode] = useState('');
  const [outputText, setOutputText] = useState('');
  const [errorText, setErrorText] = useState('');
  const [status, setStatus] = useState<RunStatus>('idle');
  const [showReward, setShowReward] = useState(false);
  const [progressValue, setProgressValue] = useState(0);

  useEffect(() => {
    if (status === 'running') {
      setProgressValue(20);
      const timer = setInterval(() => {
        setProgressValue((prev) => (prev >= 90 ? prev : prev + 10));
      }, 200);
      return () => clearInterval(timer);
    }

    if (status === 'success') {
      setProgressValue(100);
      const timeout = setTimeout(() => setProgressValue(0), 1500);
      return () => clearTimeout(timeout);
    }

    setProgressValue(status === 'idle' ? 0 : 80);
    return undefined;
  }, [status]);

  const pythonGenerator = useMemo(() => (Blockly as typeof Blockly & { Python?: { workspaceToCode: (_ws: Blockly.Workspace) => string } }).Python, []);

  const generatePythonCode = useCallback(
    (ws: Blockly.WorkspaceSvg) => pythonGenerator?.workspaceToCode(ws) ?? '',
    [pythonGenerator],
  );

  const handleWorkspaceChange = useCallback(
    (ws: Blockly.WorkspaceSvg) => {
      setWorkspace(ws);
      try {
        const code = generatePythonCode(ws);
        setGeneratedCode(code);
      } catch (err) {
        setErrorText(err instanceof Error ? err.message : '生成代码时出现问题');
      }
    },
    [generatePythonCode],
  );

  const handleRun = useCallback(async () => {
    if (!workspace) {
      setErrorText('请先在左侧拼搭积木后再运行哦！');
      setStatus('error');
      return;
    }

    try {
      setStatus('running');
      setShowReward(false);
      setErrorText('');
      setOutputText('');

      const latestCode = generatePythonCode(workspace);
      setGeneratedCode(latestCode);

      const response = await fetch(EXECUTOR_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: 'python',
          source: latestCode,
          tests: [
            {
              stdin: '',
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`执行器返回状态 ${response.status}`);
      }

      const data = (await response.json()) as ExecutorResponse;

      if (!data.ok) {
        const message =
          typeof data.error === 'string'
            ? data.error
            : '执行失败（请检查代码是否完整）';
        throw new Error(message);
      }

      const firstResult = data.results?.[0];
      const stdout = firstResult?.stdout ?? '';
      const stderr = firstResult?.stderr ?? '';

      setOutputText(stdout || '（没有标准输出）');

      if (stderr || firstResult?.timedOut) {
        const combined = [stderr, firstResult?.timedOut ? '⚠️ 运行超时' : '']
          .filter(Boolean)
          .join('\n');
        setErrorText(combined);
        setStatus('error');
        return;
      }

      setStatus('success');
      setShowReward(true);
      setTimeout(() => setShowReward(false), 1500);
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : String(error));
      setStatus('error');
    }
  }, [generatePythonCode, workspace]);

  const badgeTone = statusToneMap[status];
  const badgeLabel = statusLabelMap[status];

  const codeToDisplay = useMemo(() => generatedCode || '# 在左侧拖动积木，自动生成代码', [generatedCode]);

  return (
    <div className="lab-page">
      <header className="lab-header">
        <div>
          <h1>编程实验室 · 点亮 5 盏灯</h1>
          <p className="lab-subtitle">拖动积木生成 Python 代码，点击运行即可在下方看到控制台输出。</p>
        </div>
        <Badge text={badgeLabel} tone={badgeTone} />
      </header>

      <div className="lab-layout">
        <section className="lab-workspace">
          <Card heading="Blockly 工作区">
            <div className="workspace-frame">
              <BlocklyWorkspace onWorkspaceChange={handleWorkspaceChange} height={460} />
            </div>
          </Card>
          <Card heading="提示">
            <pre className="hint-block">{demoTaskDescription}</pre>
          </Card>
        </section>

        <aside className="lab-side">
          <Card heading="控制台">
            <div className="output-header">
              <Progress value={progressValue} label={status === 'running' ? '运行中…' : undefined} />
              <Button onClick={handleRun} disabled={status === 'running'}>
                {status === 'running' ? '运行中…' : '运行任务'}
              </Button>
            </div>
            <div className="output-panel">
              <h3>输出</h3>
              <pre>{outputText}</pre>
            </div>
            {errorText ? (
              <div className="error-panel">{errorText}</div>
            ) : (
              <div className="success-panel">
                运行成功后会在这里展示奖励提示，并自动为你保存最新代码。
              </div>
            )}
          </Card>

          <Card heading="生成的 Python 代码">
            <pre className="code-block">{codeToDisplay}</pre>
          </Card>
        </aside>
      </div>

      {showReward && (
        <div className="reward-overlay" aria-live="polite">
          <div className="reward-badge">⭐ 点亮成功！⭐</div>
        </div>
      )}
    </div>
  );
}

export default App;
