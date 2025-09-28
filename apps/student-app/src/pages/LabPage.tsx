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
  const [showHints, setShowHints] = useState(true);

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

  const handleSaveWork = useCallback(() => {
    if (workspace && pythonCode) {
      try {
        // Save to localStorage
        const works = JSON.parse(localStorage.getItem('student_works') || '[]');
        const newWork = {
          id: `work-${Date.now()}`,
          title: `实验作品 ${new Date().toLocaleString()}`,
          levelId: 'lab-experiment',
          levelTitle: '实验室创作',
          code: pythonCode,
          createdAt: new Date().toISOString(),
          likes: 0,
          isPublic: false
        };
        works.push(newWork);
        localStorage.setItem('student_works', JSON.stringify(works));
        alert('作品已保存到作品集！');
      } catch (error) {
        // console.error('Failed to save work:', error);
        alert('保存失败，请重试');
      }
    }
  }, [workspace, pythonCode]);

  return (
    <div className="lab-grid">
      <section className="lab-grid__workspace">
        <div className="lab-grid__toolbar">
          <h2>实验工坊</h2>
          <Badge tone={statusTone[status]} text={statusLabel[status]} />
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button onClick={handleExecute} disabled={!libsLoaded}>
              ? 运行代码
            </Button>
            <Button variant="secondary" onClick={handleClearWorkspace}>
              清空
            </Button>
            <Button variant="secondary" onClick={handleSaveWork} disabled={!pythonCode}>
              保存作品
            </Button>
          </div>
        </div>
        <div className="lab-grid__canvas">
          <BlocklyWorkspace onWorkspaceChange={handleWorkspaceChange} height={520} />
        </div>
      </section>

      <section className="lab-grid__side">
        <Card heading="任务提示">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p>使用积木块创建你的程序</p>
            <Button 
              variant="ghost" 
              onClick={() => setShowHints(!showHints)}
              style={{ fontSize: '12px' }}
            >
              {showHints ? '隐藏' : '显示'}提示
            </Button>
          </div>
          
          {showHints && (
            <ul className="reminder-list">
              <li>使用循环来点亮灯泡 #1 到 #5</li>
              <li>保持变量名简短且易读 (例如 <code>index</code>)</li>
              <li>尝试在循环内添加 <code>等待</code> 积木来可视化时间</li>
              <li>使用 <code>打印</code> 积木来输出调试信息</li>
            </ul>
          )}
        </Card>

        <Card heading="生成的Python代码">
          <pre className="code-preview">
            {pythonCode || '# 积木块将自动转换为Python代码'}
          </pre>
        </Card>

        <Card heading="控制台输出">
          <div className="console-panel" style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {consoleText || '运行代码后将在此显示输出结果'}
          </div>
        </Card>

        {rewardMessage ? (
          <Card heading="?? 奖励信息">
            <p>{rewardMessage}</p>
          </Card>
        ) : null}

        <Card heading="?? 实验建议">
          <ul className="reminder-list">
            <li>尝试不同的循环结构 (for, while)</li>
            <li>实验条件语句 (if/else)</li>
            <li>创建函数来组织代码</li>
            <li>保存有趣的作品到作品集</li>
          </ul>
        </Card>
      </section>
    </div>
  );
}

export default LabPage;
