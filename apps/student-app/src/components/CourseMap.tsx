import { memo, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Edge,
  type Node,
  Position,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import type { CourseMapEdge, CourseMapNode, CourseMapResponse } from '../models/course';

type StatusStyleConfig = {
  background: string;
  border: string;
  shadow?: string;
  accent: string;
  icon: string;
  label: string;
};

const STATUS_STYLES: Record<CourseMapNode['status'], StatusStyleConfig> = {
  passed: {
    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.08))',
    border: '1px solid rgba(34, 197, 94, 0.65)',
    shadow: '0 0 18px rgba(34, 197, 94, 0.35)',
    accent: '#22c55e',
    icon: '🏆',
    label: '已通关',
  },
  unlocked: {
    background: 'linear-gradient(135deg, rgba(93, 168, 255, 0.25), rgba(167, 139, 250, 0.12))',
    border: '1px solid rgba(93, 168, 255, 0.75)',
    shadow: '0 0 18px rgba(93, 168, 255, 0.35)',
    accent: '#5da8ff',
    icon: '🚀',
    label: '可挑战',
  },
  locked: {
    background: 'rgba(15, 23, 42, 0.7)',
    border: '1px solid rgba(148, 163, 184, 0.25)',
    accent: '#94a3b8',
    icon: '🔒',
    label: '待解锁',
  },
};

type CourseMapProps = {
  data: CourseMapResponse;
  onEnterLevel?: (node: CourseMapNode) => void;
  onLockedLevel?: (node: CourseMapNode) => void;
};

type InternalNodeData = CourseMapNode & {
  onEnter?: () => void;
  onLocked?: () => void;
};

const CourseMapReactNode = memo(({ data }: { data: InternalNodeData }) => {
  const style = STATUS_STYLES[data.status];

  return (
    <div
      role="button"
      tabIndex={0}
      title={data.objective ? `目标：${data.objective}` : undefined}
      onClick={() => {
        if (data.status === 'locked') {
          data.onLocked?.();
        } else {
          data.onEnter?.();
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          if (data.status === 'locked') {
            data.onLocked?.();
          } else {
            data.onEnter?.();
          }
        }
      }}
      style={{
        background: style.background,
        border: style.border,
        borderRadius: 16,
        padding: '16px 18px',
        width: 240,
        minHeight: 140,
        cursor: data.status === 'locked' ? 'not-allowed' : 'pointer',
        boxShadow: style.shadow,
        backdropFilter: 'blur(10px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        color: 'var(--text-primary)',
      }}
      onMouseEnter={(event) => {
        if (data.status !== 'locked') {
          event.currentTarget.style.transform = 'translateY(-4px)';
          event.currentTarget.style.boxShadow = `${style.shadow}, 0 16px 24px rgba(15, 23, 42, 0.35)`;
        }
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = 'none';
        event.currentTarget.style.boxShadow = style.shadow ?? 'none';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div
          style={{
            fontSize: 12,
            letterSpacing: 0.6,
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
          }}
        >
          Lv.{data.level}
        </div>
        <span style={{ fontSize: 24 }}>{style.icon}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{data.title}</h3>
        {data.objective && (
          <p
            style={{
              margin: 0,
              fontSize: 13,
              lineHeight: 1.5,
              color: 'var(--text-secondary)',
            }}
          >
            {data.objective}
          </p>
        )}
      </div>

      <div
        style={{
          marginTop: 'auto',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 0.4,
          textTransform: 'uppercase',
          color: style.accent,
        }}
      >
        {style.label}
      </div>
    </div>
  );
});

const nodeTypes = {
  courseMapNode: CourseMapReactNode,
};

const buildFlowNodes = (
  nodes: CourseMapNode[],
  onEnter?: (node: CourseMapNode) => void,
  onLocked?: (node: CourseMapNode) => void,
): Node<InternalNodeData>[] =>
  nodes.map((node) => ({
    id: node.id,
    type: 'courseMapNode',
    position: node.position,
    data: {
      ...node,
      onEnter: onEnter ? () => onEnter(node) : undefined,
      onLocked: onLocked ? () => onLocked(node) : undefined,
    },
    draggable: false,
    selectable: false,
    connectable: false,
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
  }));

const buildFlowEdges = (edges: CourseMapEdge[], nodesLookup: Map<string, CourseMapNode>): Edge[] =>
  edges.map((edge, index) => {
    const source = nodesLookup.get(edge.from);
    const target = nodesLookup.get(edge.to);
    const active = source?.status !== 'locked' && (source?.passed || target?.status !== 'locked');
    return {
      id: `edge-${index}`,
      source: edge.from,
      target: edge.to,
      type: 'smoothstep',
      animated: active,
      style: {
        stroke: active ? 'rgba(93, 168, 255, 0.7)' : 'rgba(148, 163, 184, 0.35)',
        strokeWidth: active ? 3 : 2,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: active ? 'rgba(93, 168, 255, 0.7)' : 'rgba(148, 163, 184, 0.35)',
      },
    };
  });

export function CourseMap({ data, onEnterLevel, onLockedLevel }: CourseMapProps) {
  const lookup = useMemo(() => {
    const map = new Map<string, CourseMapNode>();
    data.nodes.forEach((node) => map.set(node.id, node));
    return map;
  }, [data.nodes]);

  const flowNodes = useMemo(
    () => buildFlowNodes(data.nodes, onEnterLevel, onLockedLevel),
    [data.nodes, onEnterLevel, onLockedLevel],
  );
  const flowEdges = useMemo(() => buildFlowEdges(data.edges, lookup), [data.edges, lookup]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        fitView
        panOnScroll
        zoomOnScroll
        minZoom={0.5}
        maxZoom={1.8}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        proOptions={{ hideAttribution: true }}
        style={{ background: 'transparent' }}
      >
        <Background color="rgba(93, 168, 255, 0.12)" gap={24} size={1} />
        <Controls
          style={{
            background: 'rgba(30, 41, 59, 0.9)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: 8,
            boxShadow: '0 8px 16px rgba(15, 23, 42, 0.35)',
          }}
        />
        <MiniMap
          style={{
            background: 'rgba(30, 41, 59, 0.9)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
          }}
          nodeColor={(node) => {
            const status = (node.data as CourseMapNode).status;
            return status === 'passed' ? '#22c55e' : status === 'unlocked' ? '#5da8ff' : '#475569';
          }}
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
}
