import { useEffect, useState } from 'react';

type MapNode = {
  id: string;
  title: string;
  summary: string;
  status: 'ready' | 'locked' | 'completed';
};

type MapData = {
  nodes: MapNode[];
  edges: Array<{ from: string; to: string }>;
};

export default function MapPage() {
  const [state, setState] = useState<{
    status: 'loading' | 'error' | 'ready';
    data?: MapData;
    message?: string;
  }>({
    status: 'loading',
  });

  useEffect(() => {
    let active = true;
    fetch('/map.json')
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json() as Promise<MapData>;
      })
      .then((data) => {
        if (!active) return;
        setState({ status: 'ready', data });
      })
      .catch((error) => {
        if (!active) return;
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : String(error),
        });
      });
    return () => {
      active = false;
    };
  }, []);

  if (state.status === 'loading') {
    return <div className="card" style={{ height: 240 }} />;
  }

  if (state.status === 'error' || !state.data) {
    return <div className="alert alert-error">课程地图加载失败：{state.message ?? '未知错误'}</div>;
  }

  const { nodes } = state.data;

  return (
    <section className="kc-container" style={{ display: 'grid', gap: 20 }}>
      <header>
        <h1 className="kc-section-title">课程地图</h1>
        <p className="text-muted">按照推荐顺序完成课程节点，逐步点亮实验岛。</p>
      </header>

      <div className="grid duo">
        {nodes.map((node) => (
          <article key={node.id} className="card" style={{ padding: 20 }}>
            <div className="text-muted" style={{ fontSize: 12 }}>
              #{node.id}
            </div>
            <h2 style={{ margin: '8px 0', fontSize: 18 }}>{node.title}</h2>
            <p className="text-muted" style={{ fontSize: 14 }}>
              {node.summary}
            </p>
            <span
              className="kc-tag"
              style={{
                background:
                  node.status === 'completed'
                    ? 'rgba(34,197,94,.25)'
                    : node.status === 'ready'
                      ? 'rgba(93,168,255,.25)'
                      : 'rgba(148,163,184,.25)',
              }}
            >
              {node.status === 'completed' && '已完成'}
              {node.status === 'ready' && '可挑战'}
              {node.status === 'locked' && '待解锁'}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}
