import React, { forwardRef, type ForwardedRef } from 'react';
import { type UseFormRegisterReturn } from 'react-hook-form';

export interface FormSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

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

export interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  register?: UseFormRegisterReturn;
  options: FormSelectOption[];
  placeholder?: string;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  (
    { register, options, placeholder, className = '', onChange, onBlur, name, ...restProps },
    ref,
  ) => {
    const composedClassName = ['form-select', className].filter(Boolean).join(' ').trim();

    const renderOptions = () => (
      <>
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
      </>
    );

    if (register) {
      const { ref: registerRef, onChange: registerOnChange, onBlur: registerOnBlur, name: registerName } = register;

      const handleChange: React.ChangeEventHandler<HTMLSelectElement> = (event) => {
        registerOnChange?.(event);
        onChange?.(event);
      };

      const handleBlur: React.FocusEventHandler<HTMLSelectElement> = (event) => {
        registerOnBlur?.(event);
        onBlur?.(event);
      };

      return (
        <select
          {...restProps}
          name={name ?? registerName}
          className={composedClassName}
          onChange={handleChange}
          onBlur={handleBlur}
          ref={(element) => {
            registerRef?.(element);
            assignRef(ref, element);
          }}
        >
          {renderOptions()}
        </select>
      );
    }

    return (
      <select
        {...restProps}
        name={name}
        className={composedClassName}
        onChange={onChange}
        onBlur={onBlur}
        ref={(element) => assignRef(ref, element)}
      >
        {renderOptions()}
      </select>
    );
  },
);

FormSelect.displayName = 'FormSelect';