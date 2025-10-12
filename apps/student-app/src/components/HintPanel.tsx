import { useCallback, useEffect, useMemo, useState } from 'react';
import { getHintUsage, recordHintView, type HintUsageResponse } from '../services/progress';
import { useAuthStore } from '../stores/auth';

type HintPanelProps = {
  language: string;
  game: string;
  level: number;
  hints: string[];
  registerRevealHandler?: (handler: () => void) => void;
};

type UsageState = HintUsageResponse & { loading: boolean };

const LIMIT_REACHED_MESSAGE = '今日提示次数已用完，明天再来探索吧！';

export function HintPanel({ language, game, level, hints, registerRevealHandler }: HintPanelProps) {
  const [usage, setUsage] = useState<UsageState>({
    date: '',
    count: 0,
    limit: 3,
    loading: true,
  });
  const [visibleCount, setVisibleCount] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const displayedHints = useMemo(() => hints.slice(0, visibleCount), [hints, visibleCount]);

  const refreshUsage = useCallback(async () => {
    setUsage((prev) => ({ ...prev, loading: true }));
    try {
      const data = await getHintUsage({
        userId: useAuthStore.getState().user?.id,
        language,
        game,
        level,
      });
      setUsage({ ...data, loading: false });
      setVisibleCount(Math.min(data.count, hints.length));
      setMessage(null);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      setMessage(`提示状态读取失败：${detail}`);
      setUsage((prev) => ({ ...prev, loading: false }));
    }
  }, [language, game, level, hints.length]);

  useEffect(() => {
    setVisibleCount(0);
    setMessage(null);
    void refreshUsage();
  }, [refreshUsage, level]);

  const revealNext = useCallback(async () => {
    if (isSubmitting) return;
    if (visibleCount >= hints.length) {
      setMessage('已经展示了全部提示。');
      return;
    }
    if (!usage.loading && usage.count >= usage.limit) {
      setMessage(LIMIT_REACHED_MESSAGE);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await recordHintView({
        userId: useAuthStore.getState().user?.id,
        language,
        game,
        level,
        hintIndex: visibleCount,
      });

      setUsage({
        date: response.date,
        count: response.count,
        limit: response.limit,
        loading: false,
      });

      if (!response.allowed) {
        setMessage(LIMIT_REACHED_MESSAGE);
        return;
      }

      setVisibleCount((prev) => Math.min(prev + 1, hints.length));
      setMessage(null);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      setMessage(`提示获取失败：${detail}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, visibleCount, hints.length, usage, language, game, level]);

  useEffect(() => {
    if (!registerRevealHandler) {
      return;
    }
    registerRevealHandler(() => {
      void revealNext();
    });
  }, [registerRevealHandler, revealNext]);

  const remainingAttempts = Math.max(usage.limit - usage.count, 0);
  const canReveal =
    !usage.loading && !isSubmitting && visibleCount < hints.length && usage.count < usage.limit;

  return (
    <div className="card" style={{ marginTop: 24 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <h3 className="kc-section-title" style={{ margin: 0, fontSize: '1.1rem' }}>
          💡 阶梯提示
        </h3>
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-secondary)',
          }}
        >
          今日剩余提示：{usage.loading ? '…' : remainingAttempts}
        </div>
      </div>

      {displayedHints.length > 0 ? (
        <ol
          style={{
            paddingLeft: 18,
            margin: '0 0 16px 0',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {displayedHints.map((hint, index) => (
            <li
              key={index}
              style={{
                background: 'rgba(93, 168, 255, 0.08)',
                border: '1px solid rgba(93, 168, 255, 0.25)',
                borderRadius: 12,
                padding: '12px 14px',
                listStyle: 'decimal',
              }}
            >
              <div style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-primary)' }}>
                {hint}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-muted" style={{ marginBottom: 16 }}>
          每次查看仅解锁一条提示，循序渐进地寻找解题思路吧！
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            void revealNext();
          }}
          disabled={!canReveal}
        >
          {isSubmitting ? '⏳ 加载中...' : '🔍 查看下一条提示'}
        </button>

        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          每日限 {usage.limit} 次，已使用 {usage.loading ? '…' : usage.count} 次。
        </span>
      </div>

      {message && (
        <div
          style={{
            marginTop: 12,
            padding: '10px 12px',
            borderRadius: 10,
            background: 'rgba(248, 113, 113, 0.1)',
            color: '#fca5a5',
            fontSize: 13,
          }}
        >
          {message}
        </div>
      )}
    </div>
  );
}
