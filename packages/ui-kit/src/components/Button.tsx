import { forwardRef, type ButtonHTMLAttributes, type CSSProperties } from 'react';
import { tokens } from '../theme/tokens.js';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual style of the button.
   * @default "primary"
   */
  variant?: ButtonVariant;
  /**
   * Whether the button should render with rounded corners.
   * @default true
   */
  rounded?: boolean;
}

const baseStyles: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: tokens.spacing.xs,
  padding: `${tokens.spacing.xs} ${tokens.spacing.lg}`,
  fontFamily: tokens.typography.fontFamily,
  fontWeight: tokens.typography.weights.semibold,
  fontSize: tokens.typography.sizes.sm,
  cursor: 'pointer',
  transition: 'transform 0.12s ease, box-shadow 0.12s ease',
  borderWidth: 1,
  borderStyle: 'solid',
};

const variantStyles: Record<ButtonVariant, CSSProperties> = {
  primary: {
    background: tokens.gradients.primary,
    color: tokens.colors.surface,
    borderColor: 'transparent',
    boxShadow: tokens.shadows.md,
  },
  secondary: {
    backgroundColor: tokens.colors.surfaceAlt,
    color: tokens.colors.primary,
    borderColor: 'transparent',
    boxShadow: tokens.shadows.sm,
  },
  ghost: {
    backgroundColor: 'transparent',
    color: tokens.colors.primary,
    borderColor: tokens.colors.borderSubtle,
    boxShadow: tokens.shadows.none,
  },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', rounded = true, style, children, ...rest }, ref) => {
    const variantStyle = variantStyles[variant];
    return (
      <button
        ref={ref}
        style={{
          ...baseStyles,
          opacity: rest.disabled ? 0.6 : 1,
          cursor: rest.disabled ? 'not-allowed' : baseStyles.cursor,
          borderRadius: rounded ? tokens.radii.pill : tokens.radii.md,
          ...variantStyle,
          ...style,
        }}
        {...rest}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
