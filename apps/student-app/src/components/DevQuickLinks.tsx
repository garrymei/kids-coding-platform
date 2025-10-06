import type { CSSProperties, ReactElement } from 'react';

const containerStyle: CSSProperties = {
  position: 'fixed',
  left: 260,
  top: 88,
  zIndex: 60,
  background: 'rgba(17,24,39,.85)',
  color: '#fff',
  padding: '10px 12px',
  borderRadius: 12,
  fontSize: 12,
  boxShadow: '0 12px 24px rgba(0,0,0,.35)',
  backdropFilter: 'blur(6px)',
  border: '1px solid rgba(148,163,184,.25)',
};

const linkStyle: CSSProperties = {
  display: 'block',
  color: '#a7f3d0',
  textDecoration: 'none',
  marginBottom: 6,
};

export function DevQuickLinks(): ReactElement | null {
  if (import.meta.env.MODE !== 'development') {
    return null;
  }

  return (
    <div style={containerStyle}>
      <div style={{ opacity: 0.65, fontWeight: 700, marginBottom: 8 }}>Dev Links</div>
      <a href="/" style={linkStyle}>
        首页
      </a>
      <a href="/courses" style={{ ...linkStyle, color: '#93c5fd' }}>
        课程
      </a>
      <a href="/map" style={{ ...linkStyle, color: '#fda4af', marginBottom: 0 }}>
        课程地图
      </a>
    </div>
  );
}
