import React, { forwardRef } from 'react';
import { type UseFormRegisterReturn } from 'react-hook-form';

export interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  register: UseFormRegisterReturn;
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ register, className = '', ...props }, ref) => {
    return (
      <textarea
        {...register}
        ref={ref}
        className={`form-textarea ${className}`}
        {...props}
      />
    );
  }
);

FormTextarea.displayName = 'FormTextarea';
