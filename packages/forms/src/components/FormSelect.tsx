import React, { forwardRef, type ForwardedRef } from 'react';
import { type UseFormRegisterReturn } from 'react-hook-form';

export interface FormSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

type AssignableForwardedRef<T> = ForwardedRef<T>;

const assignRef = <T,>(target: AssignableForwardedRef<T>, value: T | null) => {
  if (typeof target === 'function') {
    target(value);
  } else if (target) {
    (target as React.MutableRefObject<T | null>).current = value;
  }
};

export interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  register?: UseFormRegisterReturn;
  options: FormSelectOption[];
  placeholder?: string;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ register, options, placeholder, className = '', ...props }, ref) => {
    const { ref: registerRef, ...registerProps } = register ?? ({} as UseFormRegisterReturn);

    const handleRef = (element: HTMLSelectElement | null) => {
      if (registerRef) {
        registerRef(element);
      }

      assignRef(ref, element);
    };

    return (
      <select {...registerProps} {...props} ref={handleRef} className={`form-select ${className}`}>
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    );
  },
);

FormSelect.displayName = 'FormSelect';
