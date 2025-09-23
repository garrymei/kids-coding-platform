import { useForm, type UseFormProps, type FieldValues, type Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { type ZodSchema } from 'zod';

export interface UseFormValidationOptions<T extends FieldValues> extends UseFormProps<T> {
  schema: ZodSchema<T>;
}

export function useFormValidation<T extends FieldValues>({
  schema,
  ...formOptions
}: UseFormValidationOptions<T>) {
  return useForm<T>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    ...formOptions,
  });
}

// Helper hook for field-specific validation
export function useFieldValidation<T extends FieldValues>(
  name: Path<T>,
  schema: ZodSchema<T>,
  formOptions?: UseFormProps<T>
) {
  const form = useFormValidation({
    schema,
    ...formOptions,
  });

  return {
    ...form,
    field: form.register(name),
    fieldState: form.formState.errors[name],
    isFieldValid: !form.formState.errors[name],
  };
}
