import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional heading displayed at the top of the card. */
  heading?: ReactNode;
  /** Use a gradient background to highlight primary content. */
  featured?: boolean;
}

export function Card({ heading, featured = false, children, style, ...rest }: CardProps) {
  return (
    <div
      style={{
        borderRadius: '18px',
        padding: '20px',
        background: featured
          ? 'linear-gradient(135deg, #6ea8ff, #846bff)'
          : '#ffffff',
        color: featured ? '#ffffff' : '#1f2b5c',
        boxShadow: '0 8px 18px rgba(0, 0, 0, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        ...style,
      }}
      {...rest}
    >
      {heading && (
        <div style={{ fontWeight: 700, fontSize: '18px', lineHeight: 1.2 }}>{heading}</div>
      )}
      <div style={{ fontSize: '14px', color: featured ? 'rgba(255,255,255,0.9)' : '#4b5bd7' }}>
        {children}
      </div>
    </div>
  );
}
