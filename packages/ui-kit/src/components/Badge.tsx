import type { HTMLAttributes } from 'react';

export type BadgeTone = 'info' | 'success' | 'warning' | 'danger';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Label to render inside the badge. */
  text: string;
  /** Visual tone of the badge. */
  tone?: BadgeTone;
}

const toneStyles: Record<BadgeTone, { background: string; color: string }> = {
  info: { background: 'rgba(110, 168, 255, 0.2)', color: '#2a5de8' },
  success: { background: 'rgba(123, 227, 181, 0.25)', color: '#1f8a5c' },
  warning: { background: 'rgba(255, 214, 107, 0.25)', color: '#a56a00' },
  danger: { background: 'rgba(255, 137, 137, 0.25)', color: '#c03647' },
};

export function Badge({ text, tone = 'info', style, ...rest }: BadgeProps) {
  const palette = toneStyles[tone];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4px 10px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 700,
        letterSpacing: '0.3px',
        backgroundColor: palette.background,
        color: palette.color,
        ...style,
      }}
      {...rest}
    >
      {text}
    </span>
  );
}
