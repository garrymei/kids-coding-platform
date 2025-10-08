import { Link } from 'react-router-dom';

import type { CreativeProject } from '../../services/creative.repo';

interface CreativeProjectCardProps {
  project: CreativeProject;
  compact?: boolean;
}

export function CreativeProjectCard({ project, compact = false }: CreativeProjectCardProps) {
  return (
    <Link
      to={`/creative/${project.id}`}
      className="card"
      style={{
        padding: compact ? 16 : 20,
        textDecoration: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        border: '1px solid rgba(148,163,184,0.25)',
      }}
    >
      {project.coverUrl ? (
        <img
          src={project.coverUrl}
          alt={project.title}
          style={{ width: '100%', borderRadius: 12, objectFit: 'cover', height: compact ? 140 : 180 }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: compact ? 140 : 180,
            borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(93,168,255,0.12), rgba(167,139,250,0.1))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            fontSize: 14,
          }}
        >
          暂无封面
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <strong style={{ fontSize: compact ? 15 : 16, color: 'var(--text)' }}>{project.title}</strong>
        <span className="kc-tag" style={{ textTransform: 'uppercase' }}>
          {project.gameType}
        </span>
      </div>

      <p className="text-muted" style={{ margin: 0, fontSize: 14, lineHeight: 1.4 }}>
        {project.summary}
      </p>

      <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
        <span>👍 {project.likes}</span>
        <span>⭐ {project.favorites}</span>
        <span>▶️ {project.runs}</span>
      </div>
    </Link>
  );
}
