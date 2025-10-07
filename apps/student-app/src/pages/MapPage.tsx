import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type NodeChange,
  Position,
  MarkerType,
  applyNodeChanges,
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';

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

// 自动对节点进行层级布局，保证图形清晰可读
const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 100, ranksep: 120 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 220, height: 120 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 110,
        y: nodeWithPosition.y - 60,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

function CourseNode({ data }: { data: MapNode & { onClick: () => void } }) {
  const statusStyles: Record<MapNode['status'], { bg: string; border: string; glow: string; icon: string; label: string }> = {
    completed: {
      bg: 'linear-gradient(135deg, rgba(34, 197, 94, 0.25), rgba(34, 197, 94, 0.1))',
      border: '2px solid rgba(34, 197, 94, 0.6)',
      glow: '0 0 20px rgba(34, 197, 94, 0.4)',
      icon: '🏆',
      label: '已完成',
    },
    ready: {
      bg: 'linear-gradient(135deg, rgba(93, 168, 255, 0.3), rgba(167, 139, 250, 0.2))',
      border: '2px solid rgba(93, 168, 255, 0.8)',
      glow: '0 0 24px rgba(93, 168, 255, 0.6)',
      icon: '🚀',
      label: '可挑战',
    },
    locked: {
      bg: 'rgba(30, 41, 59, 0.6)',
      border: '2px solid rgba(148, 163, 184, 0.3)',
      glow: 'none',
      icon: '🔒',
      label: '待解锁',
    },
  };

  const config = statusStyles[data.status];

  const nodeStyle: CSSProperties = {
    background: config.bg,
    border: config.border,
    borderRadius: '12px',
    padding: '16px',
    width: '220px',
    minHeight: '120px',
    cursor: data.status !== 'locked' ? 'pointer' : 'not-allowed',
    transition: 'all 0.3s ease',
    boxShadow: config.glow,
    backdropFilter: 'blur(8px)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  };

  return (
    <div
      style={nodeStyle}
      onClick={data.status !== 'locked' ? data.onClick : undefined}
      onMouseEnter={(event) => {
        if (data.status !== 'locked') {
          event.currentTarget.style.transform = 'scale(1.05)';
          event.currentTarget.style.boxShadow = `${config.glow}, 0 4px 12px rgba(0, 0, 0, 0.3)`;
        }
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = 'scale(1)';
        event.currentTarget.style.boxShadow = config.glow;
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div
          style={{
            fontSize: '10px',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          #{data.id}
        </div>
        <span style={{ fontSize: '18px' }}>{config.icon}</span>
      </div>

      <h3
        style={{
          fontSize: '16px',
          fontWeight: 700,
          margin: 0,
          color: data.status === 'locked' ? 'var(--text-secondary)' : 'var(--text-primary)',
        }}
      >
        {data.title}
      </h3>

      <p
        style={{
          fontSize: '12px',
          color: 'var(--text-secondary)',
          margin: 0,
          lineHeight: 1.4,
          flex: 1,
        }}
      >
        {data.summary}
      </p>

      <div
        style={{
          fontSize: '11px',
          fontWeight: 700,
          textTransform: 'uppercase',
          color:
            data.status === 'completed'
              ? '#22c55e'
              : data.status === 'ready'
                ? '#5da8ff'
                : 'var(--text-secondary)',
        }}
      >
        {config.label}
      </div>
    </div>
  );
}

const nodeTypes = {
  courseNode: CourseNode,
};

export default function MapPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<{
    status: 'loading' | 'error' | 'ready';
    data?: MapData;
    message?: string;
  }>({ status: 'loading' });

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    let active = true;

    import('@/services/level.repo').then(({ getCourseMap }) => {
      getCourseMap()
        .then((data) => {
          if (!active) return;

          const mapData: MapData = {
            nodes: data.nodes.map((node) => ({
              id: node.id,
              title: node.title,
              summary: node.summary,
              status: node.status,
            })),
            edges: data.edges,
          };

          setState({ status: 'ready', data: mapData });

          const flowNodes: Node[] = mapData.nodes.map((node) => ({
            id: node.id,
            type: 'courseNode',
            data: {
              ...node,
              onClick: () => {
                if (node.status !== 'locked') {
                  navigate(`/play/${node.id.toLowerCase()}`);
                }
              },
            },
            position: { x: 0, y: 0 },
            sourcePosition: Position.Bottom,
            targetPosition: Position.Top,
          }));

          const flowEdges: Edge[] = mapData.edges.map((edge, index) => ({
            id: `edge-${index}`,
            source: edge.from,
            target: edge.to,
            type: 'smoothstep',
            animated: true,
            style: { stroke: 'rgba(93, 168, 255, 0.5)', strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: 'rgba(93, 168, 255, 0.5)',
            },
          }));

          const layouted = getLayoutedElements(flowNodes, flowEdges);
          setNodes(layouted.nodes);
          setEdges(layouted.edges);
        })
        .catch((error) => {
          if (!active) return;
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : String(error),
          });
        });
    });

    return () => {
      active = false;
    };
  }, [navigate]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    [],
  );

  if (state.status === 'loading') {
    return (
      <div className="kc-container" style={{ padding: '2rem 0' }}>
        <div className="card" style={{ padding: '80px 40px', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🧭</div>
          <p className="text-muted">正在加载课程地图...</p>
        </div>
      </div>
    );
  }

  if (state.status === 'error' || !state.data) {
    return (
      <div className="kc-container" style={{ padding: '2rem 0' }}>
        <div className="card alert-error" style={{ padding: '40px' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
          <h3 style={{ marginBottom: '8px' }}>课程地图加载失败</h3>
          <p className="text-muted">{state.message ?? '未知错误，请稍后重试。'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="kc-container" style={{ padding: '2rem 0', height: 'calc(100vh - 120px)' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 className="kc-section-title" style={{ fontSize: '28px', marginBottom: '0.5rem' }}>
          🗺️ 课程地图
        </h1>
        <p className="text-muted">
          按推荐顺序完成课程节点，逐步解锁新的练习。拖动、缩放地图即可查看学习全貌。
        </p>
      </header>

      <div
        className="card"
        style={{
          padding: 0,
          height: 'calc(100% - 100px)',
          overflow: 'hidden',
          background: 'rgba(15, 23, 42, 0.8)',
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.5}
          maxZoom={1.5}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          style={{ background: 'transparent' }}
        >
          <Background color="rgba(93, 168, 255, 0.15)" gap={20} size={1} style={{ opacity: 0.3 }} />
          <Controls
            style={{
              background: 'rgba(30, 41, 59, 0.9)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '8px',
            }}
          />
          <MiniMap
            style={{
              background: 'rgba(30, 41, 59, 0.9)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
            }}
            nodeColor={(node) => {
              const status = (node.data as MapNode).status;
              return status === 'completed'
                ? '#22c55e'
                : status === 'ready'
                  ? '#5da8ff'
                  : '#64748b';
            }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}