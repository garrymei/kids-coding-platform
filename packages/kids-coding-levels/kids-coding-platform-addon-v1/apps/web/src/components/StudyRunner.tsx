import React, { useEffect, useState } from 'react';
import { fetchLevel } from '../services/curriculum';
import { execute, judge as judgeApi } from '../services/judge';

type Props = {
  language: string;
  game: string;
  level: number;
};

export default function StudyRunner({ language, game, level }: Props) {
  const [lv, setLv] = useState<any>(null);
  const [code, setCode] = useState('');
  const [log, setLog] = useState<string>('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [passed, setPassed] = useState(false);

  useEffect(() => {
    fetchLevel(language, game, level).then((data) => {
      setLv(data);
      setCode(data.starter_code || '');
    });
  }, [language, game, level]);

  const onRun = async () => {
    setLog('Running...');
    // client collects events for maze/turtle; here we demo unit_tests style:
    const execRes = await execute({ language, code });
    setLog(JSON.stringify(execRes, null, 2));

    // Demo: for unit_tests we assume result already known on client.
    // Here we just send equivalence payload:
    const j = await judgeApi({
      type: lv?.judge?.type || 'unit_tests',
      criteria: lv?.judge?.criteria || {},
      payload:
        lv?.judge?.type === 'unit_tests'
          ? { result: null, expected: lv?.expected_io?.output }
          : { meta: { reached: true, steps: 3 }, events: [] },
    });
    setPassed(!!j.pass);
  };

  if (!lv) return <div>Loading...</div>;

  return (
    <div className="study-runner" style={{ maxWidth: 960, margin: '0 auto', padding: 16 }}>
      <h2>
        {lv.title}（第 {lv.level} 关）
      </h2>
      <p>
        <strong>目标：</strong>
        {lv.objective}
      </p>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        style={{ width: '100%', height: 220, fontFamily: 'monospace' }}
      />

      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={onRun}>运行并判题</button>
        <button onClick={() => setShowAnswer((s) => !s)}>显示/隐藏 参考答案</button>
      </div>

      {showAnswer && (
        <pre style={{ background: '#111', color: '#0f0', padding: 12, overflow: 'auto' }}>
          {lv.reference_solution}
        </pre>
      )}

      <div style={{ marginTop: 8 }}>
        <strong>执行日志</strong>
        <pre style={{ background: '#f5f5f5', padding: 12, overflow: 'auto' }}>{log}</pre>
      </div>

      {passed ? (
        <div style={{ marginTop: 12, color: '#0a0' }}>✅ 恭喜通关！</div>
      ) : (
        <div style={{ marginTop: 12, color: '#a00' }}>❌ 尚未通过，继续加油！</div>
      )}
    </div>
  );
}
