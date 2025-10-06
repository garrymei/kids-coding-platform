import React, { forwardRef, type ForwardedRef } from 'react';
import { type UseFormRegisterReturn } from 'react-hook-form';

type AssignableForwardedRef<T> = ForwardedRef<T>;

const assignRef = <T,>(target: AssignableForwardedRef<T>, value: T | null) => {
  if (typeof target === 'function') {
    target(value);
  } else if (target) {
    (target as React.MutableRefObject<T | null>).current = value;
  }
};

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  register?: UseFormRegisterReturn;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ register, type = 'text', className = '', ...props }, ref) => {
    const { ref: registerRef, ...registerProps } = register ?? ({} as UseFormRegisterReturn);

    const handleRef = (element: HTMLInputElement | null) => {
      if (registerRef) {
        registerRef(element);
      }

      assignRef(ref, element);
    };

    return (
      <input
        {...registerProps}
        {...props}
        ref={handleRef}
        type={type}
        className={`form-input ${className}`}
      />
    );
  },
);

FormInput.displayName = 'FormInput';
