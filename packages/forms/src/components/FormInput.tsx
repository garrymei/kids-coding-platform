import React, { forwardRef } from 'react';
import { type UseFormRegisterReturn } from 'react-hook-form';

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  register: UseFormRegisterReturn;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ register, type = 'text', className = '', ...props }, ref) => {
    return (
      <input
        {...register}
        ref={ref}
        type={type}
        className={`form-input ${className}`}
        {...props}
      />
    );
  }
);

FormInput.displayName = 'FormInput';
