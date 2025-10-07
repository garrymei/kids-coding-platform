import React, { useEffect, useState } from 'react';
import { fetchLevel, fetchReference } from '../services/curriculum';
import { execute, judge as judgeApi } from '../services/judge';
import { useNavigate } from 'react-router-dom';

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
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // 新增：参考答案相关状态
  const [refCode, setRefCode] = useState<string>('');
  const [refLoading, setRefLoading] = useState(false);

  useEffect(() => {
    setError(null);
    setShowAnswer(false);
    setRefCode('');
    fetchLevel(language, game, level)
      .then((data) => {
        setLv(data);
        setCode(data.starter_code || '');
        setPassed(false);
        setLog('');
      })
      .catch((err) => {
        setError(`加载关卡失败: ${err.message}`);
      });
  }, [language, game, level]);

  const onRun = async () => {
    setIsRunning(true);
    setLog('执行中...');
    setPassed(false);
    setError(null);

    try {
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

      if (j.message) {
        setLog((prev) => prev + '\n\n判题结果: ' + j.message);
      }
    } catch (err: any) {
      setError(`执行失败: ${err.message}`);
      setLog((prev) => prev + '\n\nError: ' + err.message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleNextLevel = () => {
    navigate(`/learn/${language}/${game}/${level + 1}`);
  };

  // 新增：获取/显示参考答案
  const onToggleReference = async () => {
    if (!showAnswer && !refCode) {
      // 首次点击，需要加载参考答案
      setRefLoading(true);
      try {
        // 优先使用已加载的 lv.reference_solution（如果存在）
        const localRef = lv?.reference_solution;
        if (localRef && localRef.trim().length > 0) {
          setRefCode(localRef);
        } else {
          // 否则从专用接口获取
          const res = await fetchReference(language, game, level);
          setRefCode(res.reference_solution || '');
        }
        setShowAnswer(true);
      } catch (err: any) {
        setError(`加载参考答案失败: ${err.message}`);
      } finally {
        setRefLoading(false);
      }
    } else {
      // 已加载，只是切换显示/隐藏
      setShowAnswer((v) => !v);
    }
  };

  // 新增：一键粘贴参考答案到编辑器
  const onPasteReferenceIntoEditor = () => {
    if (refCode && refCode.trim()) {
      setCode(refCode);
      // 可选：自动隐藏参考答案
      setShowAnswer(false);
    }
  };

  if (error) {
    return (
      <div className="card">
        <div className="alert alert-error" style={{ marginBottom: 16 }}>
          {error}
        </div>
        <button className="btn btn-primary" onClick={() => navigate(-1)}>
          返回
        </button>
      </div>
    );
  }

  if (!lv) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 48 }}>
        <div className="text-muted">加载关卡数据中...</div>
      </div>
    );
  }

  return (
    <div className="study-runner">
      {/* 关卡标题卡片 */}
      <section className="card" style={{ marginBottom: 24 }}>
        <h1 className="kc-section-title" style={{ marginBottom: 8 }}>
          {lv.title}{' '}
          <span className="text-muted" style={{ fontSize: '0.8em' }}>
            （第 {lv.level} 关）
          </span>
        </h1>
        {lv.story && (
          <p className="text-muted" style={{ marginBottom: 12 }}>
            {lv.story}
          </p>
        )}
        <div
          style={{
            padding: '12px 16px',
            background: '#f0f7ff',
            borderRadius: 8,
            border: '1px solid #d0e7ff',
          }}
        >
          <strong style={{ color: '#0066cc' }}>🎯 目标：</strong>
          <span style={{ marginLeft: 8 }}>{lv.objective}</span>
        </div>
      </section>

      {/* 代码编辑器 */}
      <section className="card" style={{ marginBottom: 24 }}>
        <h3 className="kc-section-title" style={{ fontSize: '1.1rem', marginBottom: 12 }}>
          代码编辑器
        </h3>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="code-editor"
          style={{
            width: '100%',
            minHeight: 280,
            fontFamily: "'Fira Code', 'Consolas', monospace",
            fontSize: 14,
            padding: 16,
            border: '2px solid #e0e0e0',
            borderRadius: 8,
            background: '#1e1e1e',
            color: '#d4d4d4',
            resize: 'vertical',
          }}
          spellCheck={false}
        />

        {/* 操作按钮 */}
        <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={onRun}
            disabled={isRunning}
            style={{ minWidth: 120 }}
          >
            {isRunning ? '⏳ 执行中...' : '▶️ 运行并判题'}
          </button>
          <button className="btn btn-secondary" onClick={onToggleReference} disabled={refLoading}>
            {refLoading ? '⏳ 加载中...' : showAnswer ? '🙈 隐藏答案' : '💡 查看参考答案'}
          </button>
          <button
            className="btn"
            onClick={onPasteReferenceIntoEditor}
            disabled={!refCode}
            title={refCode ? '将参考答案粘贴到编辑器' : '请先查看参考答案'}
          >
            📋 粘贴到编辑器
          </button>
          <button
            className="btn"
            onClick={() => setCode(lv.starter_code || '')}
            style={{ marginLeft: 'auto' }}
          >
            🔄 重置代码
          </button>
        </div>

        {/* 参考答案 */}
        {showAnswer && (
          <div style={{ marginTop: 16 }}>
            <div
              style={{
                padding: 12,
                background: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: 8,
                marginBottom: 8,
                fontSize: '0.9em',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>⚠️ 参考答案仅供学习，建议先独立思考再查看</span>
              <button
                className="btn btn-sm"
                onClick={onPasteReferenceIntoEditor}
                disabled={!refCode}
                style={{ fontSize: '0.85em', padding: '4px 12px' }}
              >
                📋 复制到编辑器
              </button>
            </div>
            <pre
              style={{
                background: '#1e1e1e',
                color: '#4ec9b0',
                padding: 16,
                borderRadius: 8,
                overflow: 'auto',
                fontFamily: "'Fira Code', 'Consolas', monospace",
                fontSize: 14,
              }}
            >
              {refCode || '// 暂无参考答案'}
            </pre>
          </div>
        )}
      </section>

      {/* 执行结果 */}
      <section className="card" style={{ marginBottom: 24 }}>
        <h3 className="kc-section-title" style={{ fontSize: '1.1rem', marginBottom: 12 }}>
          执行结果
        </h3>
        <pre
          style={{
            background: '#f5f5f5',
            padding: 16,
            borderRadius: 8,
            overflow: 'auto',
            minHeight: 120,
            fontFamily: "'Fira Code', 'Consolas', monospace",
            fontSize: 13,
            border: '1px solid #e0e0e0',
          }}
        >
          {log || '点击"运行并判题"查看结果...'}
        </pre>

        {/* 判题结果 */}
        {passed && (
          <div
            className="alert alert-success"
            style={{
              marginTop: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '1.1em' }}>
              ✅ <strong>恭喜通关！</strong> 你成功完成了这一关！
            </span>
            <button className="btn btn-primary" onClick={handleNextLevel}>
              下一关 →
            </button>
          </div>
        )}

        {!passed && log && !isRunning && (
          <div className="alert alert-warning" style={{ marginTop: 16 }}>
            ❌ 尚未通过，继续加油！查看执行日志分析问题。
          </div>
        )}
      </section>

      {/* 提示卡片 */}
      {lv.hints && lv.hints.length > 0 && (
        <section className="card">
          <h3 className="kc-section-title" style={{ fontSize: '1.1rem', marginBottom: 12 }}>
            💡 提示
          </h3>
          <ul style={{ paddingLeft: 24, margin: 0 }}>
            {lv.hints.map((hint: string, idx: number) => (
              <li key={idx} style={{ marginBottom: 8 }}>
                {hint}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
