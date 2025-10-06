import { forwardRef, type ButtonHTMLAttributes, type CSSProperties } from 'react';
import { tokens } from '../theme/tokens.js';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual style of the button.
   * @default 'primary'
   */
  variant?: ButtonVariant;
  /**
   * Button size token controlling padding and font size.
   * @default 'md'
   */
  size?: ButtonSize;
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
  fontFamily: tokens.typography.fontFamily,
  fontWeight: tokens.typography.weights.semibold,
  cursor: 'pointer',
  transition: 'transform 0.12s ease, box-shadow 0.12s ease',
  borderWidth: 1,
  borderStyle: 'solid',
};

const sizeStyles: Record<ButtonSize, CSSProperties> = {
  sm: {
    padding: `${tokens.spacing.xs} ${tokens.spacing.md}`,
    fontSize: tokens.typography.sizes.xs,
  },
  md: {
    padding: `${tokens.spacing.xs} ${tokens.spacing.lg}`,
    fontSize: tokens.typography.sizes.sm,
  },
  lg: {
    padding: `${tokens.spacing.sm} ${tokens.spacing.xl}`,
    fontSize: tokens.typography.sizes.md,
  },
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
  ({ variant = 'primary', size = 'md', rounded = true, style, children, ...rest }, ref) => {
    const variantStyle = variantStyles[variant];
    const sizeStyle = sizeStyles[size];
    return (
      <button
        ref={ref}
        style={{
          ...baseStyles,
          ...sizeStyle,
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
