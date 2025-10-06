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

export interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  register?: UseFormRegisterReturn;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ register, className = '', ...props }, ref) => {
    const { ref: registerRef, ...registerProps } = register ?? ({} as UseFormRegisterReturn);

    const handleRef = (element: HTMLTextAreaElement | null) => {
      if (registerRef) {
        if (typeof registerRef === 'function') {
          registerRef(element);
        } else {
          registerRef.current = element;
        }
      }

      assignRef(ref, element);
    };

    return (
      <textarea
        {...registerProps}
        {...props}
        ref={handleRef}
        className={`form-textarea ${className}`}
      />
    );
  },
);

FormTextarea.displayName = 'FormTextarea';
