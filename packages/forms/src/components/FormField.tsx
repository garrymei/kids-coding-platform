import React, { forwardRef } from 'react';
import { type FieldError } from 'react-hook-form';

export interface FormFieldProps {
  label: string;
  error?: FieldError;
  required?: boolean;
  children: React.ReactElement<any>;
  helpText?: string;
  className?: string;
}

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, error, required, children, helpText, className = '' }, ref) => {
    const fieldName = (children.props as any)?.name || 'field';
    
    return (
      <div ref={ref} className={`form-field ${className}`}>
        <label className="form-field__label">
          {label}
          {required && <span className="form-field__required">*</span>}
        </label>
        <div className="form-field__input">
          {React.cloneElement(children, {
            'aria-invalid': error ? 'true' : 'false',
            'aria-describedby': error ? `${fieldName}-error` : undefined,
          } as any)}
        </div>
        {error && (
          <div id={`${fieldName}-error`} className="form-field__error">
            {error.message}
          </div>
        )}
        {helpText && !error && (
          <div className="form-field__help">{helpText}</div>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';
