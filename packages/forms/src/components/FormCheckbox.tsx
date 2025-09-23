import React, { forwardRef } from 'react';
import { type UseFormRegisterReturn } from 'react-hook-form';

export interface FormCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  register: UseFormRegisterReturn;
  label?: string;
}

export const FormCheckbox = forwardRef<HTMLInputElement, FormCheckboxProps>(
  ({ register, label, className = '', ...props }, ref) => {
    return (
      <label className={`form-checkbox ${className}`}>
        <input
          {...register}
          ref={ref}
          type="checkbox"
          className="form-checkbox__input"
          {...props}
        />
        <span className="form-checkbox__label">{label}</span>
      </label>
    );
  }
);

FormCheckbox.displayName = 'FormCheckbox';
