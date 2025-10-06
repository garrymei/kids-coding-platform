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

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  register?: UseFormRegisterReturn;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  (
    { register, type = 'text', className = '', onChange, onBlur, name, ...restProps },
    ref,
  ) => {
    const composedClassName = ['form-input', className].filter(Boolean).join(' ').trim();

    if (register) {
      const { ref: registerRef, onChange: registerOnChange, onBlur: registerOnBlur, name: registerName } = register;

      const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
        registerOnChange?.(event);
        onChange?.(event);
      };

      const handleBlur: React.FocusEventHandler<HTMLInputElement> = (event) => {
        registerOnBlur?.(event);
        onBlur?.(event);
      };

      return (
        <input
          {...restProps}
          name={name ?? registerName}
          type={type}
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
      <input
        {...restProps}
        name={name}
        type={type}
        className={composedClassName}
        onChange={onChange}
        onBlur={onBlur}
        ref={(element) => assignRef(ref, element)}
      />
    );
  },
);

FormInput.displayName = 'FormInput';