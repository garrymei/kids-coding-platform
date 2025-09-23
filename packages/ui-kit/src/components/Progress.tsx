import type { HTMLAttributes } from 'react';
import { tokens } from '../theme/tokens.js';

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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacing.xs,
        fontFamily: tokens.typography.fontFamily,
        ...style,
      }}
      {...rest}
    >
      <div
        style={{
          width: '100%',
          height: '12px',
          backgroundColor: tokens.colors.surfaceMuted,
          borderRadius: tokens.radii.pill,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${safeValue}%`,
            height: '100%',
            background: tokens.gradients.progress,
            borderRadius: tokens.radii.pill,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: tokens.typography.sizes.xs,
          color: tokens.colors.textMuted,
          fontWeight: tokens.typography.weights.semibold,
        }}
      >
        <span>{label}</span>
        <span>{safeValue}%</span>
      </div>
    </div>
  );
}
