import type { HTMLAttributes } from 'react';
import { tokens } from '../theme/tokens.js';

export type BadgeTone = 'info' | 'success' | 'warning' | 'danger';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Label to render inside the badge. */
  text: string;
  /** Visual tone of the badge. */
  tone?: BadgeTone;
}

const toneStyles: Record<BadgeTone, { backgroundColor: string; color: string }> = {
  info: { backgroundColor: tokens.colors.infoSoft, color: tokens.colors.info },
  success: { backgroundColor: tokens.colors.successSoft, color: tokens.colors.success },
  warning: { backgroundColor: tokens.colors.warningSoft, color: tokens.colors.warning },
  danger: { backgroundColor: tokens.colors.dangerSoft, color: tokens.colors.danger },
};

export function Badge({ text, tone = 'info', style, ...rest }: BadgeProps) {
  const palette = toneStyles[tone];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${tokens.spacing.xxs} ${tokens.spacing.sm}`,
        borderRadius: tokens.radii.pill,
        fontSize: tokens.typography.sizes.xs,
        fontWeight: tokens.typography.weights.bold,
        fontFamily: tokens.typography.fontFamily,
        letterSpacing: '0.3px',
        backgroundColor: palette.backgroundColor,
        color: palette.color,
        ...style,
      }}
      {...rest}
    >
      {text}
    </span>
  );
}
