import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchLevel, fetchReference } from '../services/curriculum';
import { execute, judge as judgeApi } from '../services/judge';
import { CodeEditor } from './CodeEditor';
import { BlockEditor } from './BlockEditor';
import { ResultPanel, type ExecutionSummary, type JudgeSummary } from './ResultPanel';
import { progressStore } from '../store/progress';
import { HintPanel } from './HintPanel';
import { PassAnimation } from './PassAnimation';
import { updateAchievements } from '../services/achievements';
import { updateProgress } from '../services/progress';
import { useAuthStore } from '../stores/auth';
import { clearSnapshot, loadSnapshot, saveSnapshot, type EditorMode } from '../utils/localStore';

type Props = {
  language: string;
  game: string;
  level: number;
};

type RunOutcome = {
  execution: ExecutionSummary;
  judge: JudgeSummary;
  debug: {
    execute: unknown;
    judge: unknown;
    payload: unknown;
  };
};

type PassAnimationState = {
  level: number;
  xpAwarded: number;
  badges: string[];
  petLabel: string;
};

const XP_POP_DURATION_MS = 1800;

const coinsFromScore = (score?: number): number => {
  if (typeof score !== 'number') return 5;
  return Math.max(1, Math.round(score / 20));
};

const ensureAudioContext = (ref: MutableRefObject<AudioContext | null>): AudioContext | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const Ctor = window.AudioContext || (window as any).webkitAudioContext;
  if (!Ctor) {
    return null;
  }

  if (!ref.current) {
    ref.current = new Ctor();
  }

  if (ref.current.state === 'suspended') {
    ref.current.resume().catch(() => undefined);
  }

  return ref.current;
};

const LANGUAGE_NAMES: Record<string, string> = {
  python: 'Python',
  javascript: 'JavaScript',
};

export default function StudyRunner({ language, game, level }: Props) {
  const navigate = useNavigate();

  const [lv, setLv] = useState<any>(null);
  const [code, setCode] = useState('');
  const [blockXml, setBlockXml] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>('code');
  const [showAnswer, setShowAnswer] = useState(false);
  const [diffSource, setDiffSource] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [refCode, setRefCode] = useState<string>('');
  const [refLoading, setRefLoading] = useState(false);
  const [result, setResult] = useState<RunOutcome | null>(null);
  const [xpBurst, setXpBurst] = useState<number | null>(null);
  const [snapshotMessage, setSnapshotMessage] = useState<string | null>(null);
  const [passAnimation, setPassAnimation] = useState<PassAnimationState | null>(null);

  const hintsRef = useRef<HTMLDivElement | null>(null);
  const hintRevealRef = useRef<(() => void) | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const confettiRef = useRef<((opts?: Record<string, unknown>) => void) | null>(null);
  const xpTimerRef = useRef<number | null>(null);
  const latestStateRef = useRef<{ code: string; blockXml: string | null; mode: EditorMode }>({
    code: '',
    blockXml: null,
    mode: 'code',
  });
  const pendingRunRef = useRef<{ code: string; timestamp: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPageError(null);
    setRunError(null);
    setShowAnswer(false);
    setDiffSource(null);
    setRefCode('');
    setRefLoading(false);
    setResult(null);
    setSnapshotMessage(null);
    hintRevealRef.current = null;
    pendingRunRef.current = null;

    const snapshot = loadSnapshot(language, game, level);

    fetchLevel(language, game, level)
      .then((data) => {
        if (cancelled) return;
        setLv(data);

        if (snapshot) {
          setCode(snapshot.code);
          setBlockXml(snapshot.blockXml ?? null);
          setEditorMode(snapshot.mode);
          setSnapshotMessage('已恢复上次保存的代码内容。');
        } else {
          setCode(data.starter_code || '');
          setBlockXml(null);
          setEditorMode('code');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setPageError(`加载关卡失败: ${err.message}`);
      });

    return () => {
      cancelled = true;
      if (xpTimerRef.current) {
        window.clearTimeout(xpTimerRef.current);
        xpTimerRef.current = null;
      }
    };
  }, [language, game, level]);

  useEffect(() => {
    latestStateRef.current = { code, blockXml, mode: editorMode };
  }, [code, blockXml, editorMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const interval = window.setInterval(() => {
      saveSnapshot(language, game, level, {
        code: latestStateRef.current.code,
        blockXml: latestStateRef.current.blockXml,
        mode: latestStateRef.current.mode,
        timestamp: Date.now(),
      });
    }, 10000);
    return () => window.clearInterval(interval);
  }, [language, game, level]);

  useEffect(() => {
    return () => {
      saveSnapshot(language, game, level, {
        code: latestStateRef.current.code,
        blockXml: latestStateRef.current.blockXml,
        mode: latestStateRef.current.mode,
        timestamp: Date.now(),
      });
    };
  }, [language, game, level]);

  const playTone = useCallback(
    (frequency: number, durationMs: number, type: OscillatorType = 'sine') => {
      const ctx = ensureAudioContext(audioCtxRef);
      if (!ctx) return;

      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      oscillator.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      const durationSeconds = durationMs / 1000;

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.3, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);

      oscillator.start(now);
      oscillator.stop(now + durationSeconds);
    },
    [],
  );

  const playSuccessSound = useCallback(() => {
    playTone(880, 180, 'triangle');
    window.setTimeout(() => playTone(1320, 220, 'sine'), 150);
  }, [playTone]);

  const playFailureSound = useCallback(() => {
    playTone(220, 260, 'sawtooth');
  }, [playTone]);

  const launchConfetti = useCallback(async () => {
    if (typeof window === 'undefined') return;
    if (!confettiRef.current) {
      const mod = await import('canvas-confetti');
      confettiRef.current = mod.default;
    }
    confettiRef.current?.({
      particleCount: 140,
      spread: 70,
      origin: { y: 0.6 },
      scalar: 0.9,
    });
  }, []);

  const buildJudgePayload = useCallback(
    (judgeType: string, execRes: any) => {
      switch (judgeType) {
        case 'stdout_compare':
          return {
            stdout: execRes.stdout || '',
            stderr: execRes.stderr || '',
            success: execRes.success !== false,
          };
        case 'api_events':
          return {
            events: execRes.events || [],
            meta: execRes.meta || { reached: false, steps: 0 },
            stdout: execRes.stdout,
            stderr: execRes.stderr,
            success: execRes.success !== false,
          };
        case 'svg_path_similarity':
          return {
            segments: execRes.segments || [],
            bbox: execRes.bbox || null,
            stdout: execRes.stdout,
            stderr: execRes.stderr,
            success: execRes.success !== false,
          };
        case 'unit_tests':
          return {
            result: execRes.result ?? null,
            expected: execRes.expected ?? lv?.expected_io?.output,
            tests: execRes.tests || [],
            stdout: execRes.stdout,
            stderr: execRes.stderr,
            success: execRes.success !== false,
          };
        default:
          return execRes;
      }
    },
    [lv],
  );

  const hasReference = useMemo(() => {
    return (
      (lv?.reference_solution && lv.reference_solution.trim().length > 0) ||
      refCode.trim().length > 0
    );
  }, [lv, refCode]);

  const executeAndJudge = useCallback(
    async (sourceCode: string, { isRetry = false } = {}) => {
      setIsRunning(true);
      setRunError(null);
      pendingRunRef.current = null;

      try {
        const execRes = await execute({
          lang: language,
          language,
          code: sourceCode,
        });

        const execution: ExecutionSummary = {
          stdout: execRes.stdout ?? undefined,
          stderr: execRes.stderr ?? undefined,
          timeMs: typeof execRes.timeMs === 'number' ? execRes.timeMs : 0,
          timeout: execRes.timeout ?? false,
          meta: execRes.meta ?? undefined,
          events: execRes.events ?? undefined,
        };

        const judgeType = lv?.judge?.type || 'unit_tests';
        const payload = buildJudgePayload(judgeType, execRes);
        const judgeRes = await judgeApi({
          type: judgeType,
          criteria: lv?.judge?.criteria || {},
          payload,
        });

        const judge: JudgeSummary = {
          pass: !!judgeRes.pass,
          message: judgeRes.message ?? (judgeRes.pass ? '恭喜通过！' : '未通过，请继续努力'),
          details: judgeRes.details,
          score: typeof judgeRes.score === 'number' ? judgeRes.score : judgeRes.pass ? 100 : 0,
          stdout: judgeRes.stdout ?? execution.stdout,
          stderr: judgeRes.stderr ?? execution.stderr,
          timeMs: typeof judgeRes.timeMs === 'number' ? judgeRes.timeMs : undefined,
          xpAwarded:
            typeof judgeRes.xpAwarded === 'number' ? judgeRes.xpAwarded : judgeRes.pass ? 10 : 0,
        };

        setResult({
          execution,
          judge,
          debug: { execute: execRes, judge: judgeRes, payload },
        });

        if (judge.pass) {
          const levelId = (lv as any)?.id || `${language}-${game}-${level}`;
          const wasCompleted = progressStore.isLevelCompleted(levelId);
          const baseXp = judge.xpAwarded ?? 10;
          const coins = coinsFromScore(judge.score);
          progressStore.completeLevel(levelId, baseXp, coins);

          // 持久化到后端进度服务（用于课程地图合并）
          try {
            await updateProgress({
              userId: useAuthStore.getState().user?.id,
              language,
              game,
              level,
              durationMs: execution.timeMs ?? undefined,
            });
          } catch (e) {
            // 不中断前端流程，记录错误即可
            console.warn('updateProgress failed:', e);
          }

          let totalXpAward = baseXp;
          let petLabel = '初生火花';
          let badges: string[] = [];

          try {
            const achievementsResult = await updateAchievements({
              xpDelta: baseXp,
              reason: 'level_pass',
              metadata: {
                levelId,
                language,
                game,
              },
            });
            const bonus = achievementsResult.newlyUnlocked.reduce(
              (sum, item) => sum + item.xpReward,
              0,
            );
            totalXpAward += bonus;
            badges = achievementsResult.newlyUnlocked.map((item) => item.title);
            petLabel = achievementsResult.pet.label;
            setPassAnimation({
              level: achievementsResult.level,
              xpAwarded: totalXpAward,
              badges,
              petLabel,
            });
          } catch (error) {
            console.warn('updateAchievements failed', error);
          }

          const xpToApply = wasCompleted ? totalXpAward : totalXpAward - baseXp;
          if (xpToApply > 0) {
            progressStore.addXp(xpToApply);
          }

          setXpBurst(totalXpAward);
          playSuccessSound();
          launchConfetti().catch(() => undefined);

          if (xpTimerRef.current) {
            window.clearTimeout(xpTimerRef.current);
          }
          xpTimerRef.current = window.setTimeout(() => {
            setXpBurst(null);
            xpTimerRef.current = null;
          }, XP_POP_DURATION_MS);
        } else if (!isRetry) {
          playFailureSound();
        }
      } catch (error) {
        const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
        const message = error instanceof Error ? error.message : '执行失败，请稍后再试';
        setRunError(offline ? '网络连接中断，恢复后将自动重试。' : message);
        if (offline) {
          pendingRunRef.current = { code: sourceCode, timestamp: Date.now() };
        } else {
          playFailureSound();
        }
      } finally {
        setIsRunning(false);
      }
    },
    [
      language,
      game,
      level,
      lv,
      buildJudgePayload,
      playFailureSound,
      playSuccessSound,
      launchConfetti,
    ],
  );

  useEffect(() => {
    const handleOnline = () => {
      if (!pendingRunRef.current) return;
      const pending = pendingRunRef.current;
      pendingRunRef.current = null;
      void executeAndJudge(pending.code, { isRetry: true });
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [executeAndJudge]);

  const ensureReferenceLoaded = useCallback(async () => {
    if (refCode.trim()) {
      setShowAnswer(true);
      setDiffSource(refCode);
      return;
    }
    setRefLoading(true);
    try {
      const localRef = lv?.reference_solution;
      if (localRef && localRef.trim().length > 0) {
        setRefCode(localRef);
        setDiffSource(localRef);
      } else {
        const res = await fetchReference(language, game, level);
        setRefCode(res.reference_solution || '');
        setDiffSource(res.reference_solution || '');
      }
      setShowAnswer(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setRunError(`加载参考答案失败: ${message}`);
    } finally {
      setRefLoading(false);
    }
  }, [language, game, level, lv, refCode]);

  const onPasteReferenceIntoEditor = useCallback(() => {
    if (!refCode.trim()) return;
    setCode(refCode);
    setDiffSource(null);
  }, [refCode]);

  const onRun = useCallback(() => {
    if (!code.trim()) {
      setRunError('请先编写代码');
      return;
    }
    void executeAndJudge(code);
  }, [code, executeAndJudge]);

  const handleNextLevel = useCallback(() => {
    navigate(`/learn/${language}/${game}/${level + 1}`);
  }, [navigate, language, game, level]);

  const handleViewHints = useCallback(() => {
    hintRevealRef.current?.();
    window.requestAnimationFrame(() => {
      hintsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  const handleReset = useCallback(() => {
    if (lv?.starter_code) {
      setCode(lv.starter_code);
    } else {
      setCode('');
    }
    setBlockXml(null);
    setEditorMode('code');
    setDiffSource(null);
    clearSnapshot(language, game, level);
  }, [lv, language, game, level]);

  const themeClass = useMemo(() => {
    const key = LANGUAGE_NAMES[language.toLowerCase()] ? language.toLowerCase() : 'default';
    return `theme-${key}`;
  }, [language]);

  const languageLabel = LANGUAGE_NAMES[language.toLowerCase()] ?? language;
  const gameLabel = useMemo(() => {
    if (!game) return '';
    return game
      .split(/[-_]/)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  }, [game]);
  const levelLabel = lv?.title ? lv.title : `第 ${level} 关`;

  const handleRetry = useCallback(() => {
    setResult(null);
    setRunError(null);
    setShowAnswer(false);
    setDiffSource(null);
  }, []);

  if (pageError) {
    return (
      <div className="card">
        <div className="alert alert-error" style={{ marginBottom: 16 }}>
          {pageError}
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
    <div className={`study-runner ${themeClass}`}>
      {passAnimation && (
        <PassAnimation
          visible
          level={passAnimation.level}
          xpAwarded={passAnimation.xpAwarded}
          newlyUnlockedBadges={passAnimation.badges}
          petLabel={passAnimation.petLabel}
          onClose={() => setPassAnimation(null)}
        />
      )}

      {xpBurst != null && <div className="xp-burst">+{xpBurst} XP!</div>}

      <nav className="breadcrumbs" aria-label="学习路径导航">
        <span>{languageLabel}</span>
        <span>/</span>
        <span>{gameLabel}</span>
        <span>/</span>
        <span>{levelLabel}</span>
      </nav>

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

      <section className="card" style={{ marginBottom: 24 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className={`btn ${editorMode === 'code' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setEditorMode('code')}
            >
              💻 代码模式
            </button>
            <button
              className={`btn ${editorMode === 'blocks' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setEditorMode('blocks')}
            >
              🧱 积木模式
            </button>
          </div>
          {snapshotMessage && (
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{snapshotMessage}</span>
          )}
        </div>

        {editorMode === 'code' ? (
          <CodeEditor
            language={(language as 'python' | 'javascript') || 'python'}
            value={code}
            onChange={(next) => {
              setCode(next);
              latestStateRef.current = { ...latestStateRef.current, code: next };
            }}
            diffSource={diffSource}
            height={360}
          />
        ) : (
          <BlockEditor
            language={(language as 'python' | 'javascript') || 'python'}
            workspaceXml={blockXml}
            onWorkspaceChange={({ xml, code: generated }) => {
              setBlockXml(xml);
              setCode(generated);
              latestStateRef.current = { code: generated, blockXml: xml, mode: 'blocks' };
            }}
            height={360}
          />
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={onRun} disabled={isRunning}>
            {isRunning ? (
              <>
                <span style={{ marginRight: 8 }}>⏳</span>运行中...
              </>
            ) : (
              <>
                <span style={{ marginRight: 8 }}>▶️</span>运行并判题
              </>
            )}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              if (showAnswer) {
                setShowAnswer(false);
                setDiffSource(null);
              } else {
                void ensureReferenceLoaded();
              }
            }}
            disabled={refLoading}
          >
            {refLoading ? '⏳ 加载中...' : showAnswer ? '🙈 隐藏答案' : '💡 查看参考答案'}
          </button>
          <button
            className="btn"
            onClick={onPasteReferenceIntoEditor}
            disabled={!hasReference}
            title={hasReference ? '将参考答案粘贴到编辑器' : '需要先加载参考答案'}
          >
            📋 粘贴到编辑器
          </button>
          <button className="btn btn-ghost" onClick={handleReset}>
            🔄 重置代码
          </button>
        </div>

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
              <span>⚠️ 参考答案仅供学习，建议先独立思考再查看。</span>
              <button
                className="btn btn-sm"
                onClick={onPasteReferenceIntoEditor}
                disabled={!hasReference}
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
              {refCode || lv.reference_solution || '// 暂无参考答案'}
            </pre>
          </div>
        )}
      </section>

      <section className="card" style={{ marginBottom: 24 }}>
        <h3 className="kc-section-title" style={{ fontSize: '1.1rem', marginBottom: 12 }}>
          判题反馈
        </h3>
        <ResultPanel
          execution={result?.execution ?? null}
          judge={result?.judge ?? null}
          isRunning={isRunning}
          error={runError}
          onViewHints={Array.isArray(lv.hints) && lv.hints.length ? handleViewHints : undefined}
          onViewReference={!showAnswer ? ensureReferenceLoaded : undefined}
          showHintButton={Array.isArray(lv.hints) && lv.hints.length > 0}
          showReferenceButton
          extraFooter={
            result ? (
              <details className="result-panel__debug">
                <summary>查看原始执行数据</summary>
                <pre className="result-panel__details-pre">
                  {JSON.stringify(result.debug, null, 2)}
                </pre>
              </details>
            ) : null
          }
        />

        {result?.judge.pass && (
          <div
            className="alert alert-success"
            style={{
              marginTop: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '1.05em' }}>
              ✅ <strong>恭喜通关！</strong> 你可以继续挑战下一关。
            </span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-secondary" onClick={handleRetry}>
                重新挑战
              </button>
              <button className="btn btn-primary" onClick={handleNextLevel}>
                下一关 →
              </button>
            </div>
          </div>
        )}
      </section>

      {Array.isArray(lv.hints) && lv.hints.length > 0 && (
        <div ref={hintsRef}>
          <HintPanel
            key={`${language}-${game}-${level}`}
            language={language}
            game={game}
            level={level}
            hints={lv.hints}
            registerRevealHandler={(handler) => {
              hintRevealRef.current = handler;
            }}
          />
        </div>
      )}
    </div>
  );
}
