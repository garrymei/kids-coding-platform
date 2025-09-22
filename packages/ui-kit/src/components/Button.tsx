import { forwardRef, type ButtonHTMLAttributes } from 'react';

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

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'background: linear-gradient(135deg, #6ea8ff, #846bff); color: #fff; border: none;',
  secondary: 'background-color: #f0f3ff; color: #5560ff; border: none;',
  ghost: 'background-color: transparent; color: #5560ff; border: 1px solid rgba(85, 96, 255, 0.3);',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', rounded = true, style, children, ...rest }, ref) => {
    const borderRadius = rounded ? '999px' : '12px';
    return (
      <button
        ref={ref}
        style={{
          padding: '10px 18px',
          fontWeight: 600,
          fontSize: '14px',
          cursor: rest.disabled ? 'not-allowed' : 'pointer',
          opacity: rest.disabled ? 0.6 : 1,
          transition: 'transform 0.12s ease, box-shadow 0.12s ease',
          borderRadius,
          boxShadow: variant === 'primary' ? '0 6px 14px rgba(0, 0, 0, 0.12)' : 'none',
          ...parseInlineStyle(variantStyles[variant]),
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

function parseInlineStyle(style: string): Record<string, string | number> {
  return style.split(';').reduce<Record<string, string | number>>((acc, current) => {
    const [rawProp, rawValue] = current.split(':');
    if (!rawProp || !rawValue) return acc;
    const prop = rawProp.trim();
    const value = rawValue.trim();
    const jsProp = prop.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    acc[jsProp] = value;
    return acc;
  }, {});
}
