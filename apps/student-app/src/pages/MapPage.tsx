import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { CourseMapResponse, CourseMapNode } from '../models/course';
import { fetchCourseMap } from '../services/course-map';
import { CourseMap } from '../components/CourseMap';

type SelectionOption = {
  language: string;
  game: string;
  label: string;
};

const COURSE_OPTIONS: SelectionOption[] = [
  { language: 'python', game: 'maze_navigator', label: 'Python · 迷宫探索' },
  { language: 'python', game: 'turtle_artist', label: 'Python · 海龟画家' },
  { language: 'python', game: 'robot_sorter', label: 'Python · 机器人分拣' },
  { language: 'javascript', game: 'turtle_artist', label: 'JavaScript · 海龟画家' },
  { language: 'javascript', game: 'robot_sorter', label: 'JavaScript · 机器人分拣' },
];

const DEFAULT_OPTION = COURSE_OPTIONS[0];

type MapState =
  | { status: 'loading'; data?: undefined; error?: undefined }
  | { status: 'ready'; data: CourseMapResponse; error?: undefined }
  | { status: 'error'; data?: undefined; error: string };

export default function MapPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState<MapState>({ status: 'loading' });
  const [banner, setBanner] = useState<string | null>(null);

  const selection = useMemo(() => {
    const language = searchParams.get('language') ?? DEFAULT_OPTION.language;
    const game = searchParams.get('game') ?? DEFAULT_OPTION.game;
    const option =
      COURSE_OPTIONS.find((item) => item.language === language && item.game === game) ??
      DEFAULT_OPTION;
    return option;
  }, [searchParams]);

  const loadMap = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const data = await fetchCourseMap({
        language: selection.language,
        game: selection.game,
      });
      setState({ status: 'ready', data });
    } catch (error) {
      const message = error instanceof Error ? error.message : '课程地图加载失败，请稍后再试';
      setState({ status: 'error', error: message });
    }
  }, [selection.language, selection.game]);

  useEffect(() => {
    void loadMap();
  }, [loadMap]);

  const handleSelectionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    const option = COURSE_OPTIONS.find((item) => `${item.language}:${item.game}` === value);
    if (!option) return;
    setSearchParams({
      language: option.language,
      game: option.game,
    });
  };

  const handleEnterLevel = (node: CourseMapNode) => {
    navigate(`/learn/${node.language}/${node.game}/${node.level}`);
  };

  const handleLockedLevel = (node: CourseMapNode) => {
    setBanner(`关卡「${node.title}」尚未解锁，请先完成前置关卡。`);
    window.setTimeout(() => setBanner(null), 2600);
  };

  return (
    <div className="kc-container" style={{ padding: '2rem 0', height: 'calc(100vh - 120px)' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 className="kc-section-title" style={{ fontSize: 28, marginBottom: 12 }}>
          🗺️ 课程地图
        </h1>
        <p className="text-muted" style={{ maxWidth: 640, lineHeight: 1.6 }}>
          直观查看学习路径与关卡状态。完成当前节点后，下一关会自动解锁。放大、缩小或拖动地图，规划你的闯关路线。
        </p>
      </header>

      <section
        className="card"
        style={{
          marginBottom: 20,
          padding: '16px 20px',
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span
            style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-secondary)' }}
          >
            学习路线
          </span>
          <select
            value={`${selection.language}:${selection.game}`}
            onChange={handleSelectionChange}
            style={{
              minWidth: 220,
              padding: '8px 12px',
              borderRadius: 10,
              border: '1px solid rgba(148, 163, 184, 0.35)',
              background: 'rgba(15, 23, 42, 0.65)',
              color: 'var(--text-primary)',
            }}
          >
            {COURSE_OPTIONS.map((item) => (
              <option key={`${item.language}:${item.game}`} value={`${item.language}:${item.game}`}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {state.status === 'ready' && (
          <div
            style={{
              display: 'flex',
              gap: 16,
              padding: '8px 12px',
              borderRadius: 10,
              background: 'rgba(93, 168, 255, 0.08)',
            }}
          >
            <span>总关卡：{state.data.stats.total}</span>
            <span>已完成：{state.data.stats.completed}</span>
            <span>已解锁：{state.data.stats.unlocked}</span>
          </div>
        )}

        {banner && (
          <div
            style={{
              marginLeft: 'auto',
              padding: '10px 16px',
              borderRadius: 12,
              background: 'rgba(248, 113, 113, 0.18)',
              color: '#fecaca',
              fontSize: 13,
            }}
          >
            {banner}
          </div>
        )}
      </section>

      <div
        className="card"
        style={{
          padding: 0,
          height: 'calc(100% - 200px)',
          minHeight: 460,
          overflow: 'hidden',
          background: 'rgba(15, 23, 42, 0.82)',
          position: 'relative',
        }}
      >
        {state.status === 'loading' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 42, marginBottom: 12 }}>🧭</div>
              <p style={{ margin: 0 }}>正在加载课程地图...</p>
            </div>
          </div>
        )}

        {state.status === 'error' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fecaca',
              textAlign: 'center',
              padding: 32,
            }}
          >
            <div>
              <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
              <h3 style={{ marginBottom: 8 }}>课程地图加载失败</h3>
              <p style={{ margin: 0, fontSize: 14 }}>{state.error}</p>
            </div>
          </div>
        )}

        {state.status === 'ready' && (
          <CourseMap
            data={state.data}
            onEnterLevel={handleEnterLevel}
            onLockedLevel={handleLockedLevel}
          />
        )}
      </div>
    </div>
  );
}
