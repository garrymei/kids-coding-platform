import React, { forwardRef } from 'react';
import { type UseFormRegisterReturn } from 'react-hook-form';

export interface FormSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  register: UseFormRegisterReturn;
  options: FormSelectOption[];
  placeholder?: string;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ register, options, placeholder, className = '', ...props }, ref) => {
    return (
      <select
        {...register}
        ref={ref}
        className={`form-select ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    );
  }
);

FormSelect.displayName = 'FormSelect';
