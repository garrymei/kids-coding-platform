import React, { forwardRef, type ForwardedRef } from 'react';
import { type UseFormRegisterReturn } from 'react-hook-form';

const assignRef = <T,>(target: ForwardedRef<T>, value: T | null) => {
  if (!target) {
    return;
  }

  if (typeof target === 'function') {
    target(value);
  } else {
    target.current = value;
  }
};

export interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  register?: UseFormRegisterReturn;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ register, className = '', onChange, onBlur, name, ...restProps }, ref) => {
    const composedClassName = ['form-textarea', className].filter(Boolean).join(' ').trim();

    if (register) {
      const { ref: registerRef, onChange: registerOnChange, onBlur: registerOnBlur, name: registerName } = register;

      const handleChange: React.ChangeEventHandler<HTMLTextAreaElement> = (event) => {
        registerOnChange?.(event);
        onChange?.(event);
      };

      const handleBlur: React.FocusEventHandler<HTMLTextAreaElement> = (event) => {
        registerOnBlur?.(event);
        onBlur?.(event);
      };

      return (
        <textarea
          {...restProps}
          name={name ?? registerName}
          className={composedClassName}
          onChange={handleChange}
          onBlur={handleBlur}
          ref={(element) => {
            registerRef?.(element);
            assignRef(ref, element);
          }}
        />
      );
    }

    return (
      <textarea
        {...restProps}
        name={name}
        className={composedClassName}
        onChange={onChange}
        onBlur={onBlur}
        ref={(element) => assignRef(ref, element)}
      />
    );
  },
);

FormTextarea.displayName = 'FormTextarea';