import type { HTMLAttributes } from 'react';

export interface ProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /**
   * Progress percentage between 0 and 100.
   */
  value: number;
  /** Label displayed on the right side. */
  label?: string;
}

export function Progress({ value, label, style, ...rest }: ProgressProps) {
  const safeValue = Math.min(100, Math.max(0, value));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', ...style }} {...rest}>
      <div
        style={{
          width: '100%',
          height: '12px',
          backgroundColor: '#eef1f6',
          borderRadius: '999px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${safeValue}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #6ea8ff, #23d3ff)',
            borderRadius: '999px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: '#5c6b9b',
          fontWeight: 600,
        }}
      >
        <span>{label}</span>
        <span>{safeValue}%</span>
      </div>
    </div>
  );
}
