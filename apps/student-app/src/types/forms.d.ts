declare module '@kids/forms' {
  import { ReactNode } from 'react';
  
  export interface FormFieldProps {
    label: string;
    children: ReactNode;
    error?: string;
    required?: boolean;
    helpText?: string;
  }
  
  export interface FormInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: string;
  }
  
  export interface FormSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
    placeholder?: string;
  }
  
  export interface FormCheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
  }
  
  export interface FormTextareaProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    rows?: number;
  }
  
  export interface LoginFormData {
    email: string;
    password: string;
  }
  
  export interface SearchSettingsData {
    isSearchable: boolean;
    className?: string;
    searchNickname?: string;
    schoolName?: string;
  }
  
  export const FormField: React.FC<FormFieldProps>;
  export const FormInput: React.FC<FormInputProps>;
  export const FormSelect: React.FC<FormSelectProps>;
  export const FormCheckbox: React.FC<FormCheckboxProps>;
  export const FormTextarea: React.FC<FormTextareaProps>;
  
  export function useFormValidation<T>(schema: any): {
    register: (name: string) => any;
    handleSubmit: (callback: (data: T) => void) => (e: any) => void;
    watch: (name: string) => any;
    setValue: (name: string, value: any) => void;
    reset: (data?: T) => void;
    errors: Record<string, string>;
    formState: {
      errors: Record<string, string>;
      isSubmitting: boolean;
    };
  };
  
  export const loginSchema: any;
}
