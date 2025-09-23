import type { HTMLAttributes, ReactNode } from 'react';
import { tokens } from '../theme/tokens.js';

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
        borderRadius: tokens.radii.lg,
        padding: tokens.spacing.lg,
        background: featured ? tokens.gradients.primary : tokens.colors.surface,
        color: featured ? tokens.colors.surface : tokens.colors.textPrimary,
        boxShadow: featured ? tokens.shadows.lg : tokens.shadows.md,
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacing.sm,
        ...style,
      }}
      {...rest}
    >
      {heading && (
        <div
          style={{
            fontFamily: tokens.typography.fontFamily,
            fontWeight: tokens.typography.weights.bold,
            fontSize: tokens.typography.sizes.lg,
            lineHeight: 1.2,
          }}
        >
          {heading}
        </div>
      )}
      <div
        style={{
          fontSize: tokens.typography.sizes.sm,
          fontFamily: tokens.typography.fontFamily,
          color: featured ? 'rgba(255, 255, 255, 0.92)' : tokens.colors.textSecondary,
        }}
      >
        {children}
      </div>
    </div>
  );
}
