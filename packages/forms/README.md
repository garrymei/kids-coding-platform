# @kids/forms

Shared form validation utilities and components for the Kids Coding Platform.

## Features

- **Form Validation**: React Hook Form + Zod integration
- **Reusable Components**: Pre-built form components with consistent styling
- **Type Safety**: Full TypeScript support with inferred types
- **Accessibility**: ARIA attributes and keyboard navigation support
- **Customizable**: Easy to extend and customize

## Installation

```bash
pnpm add @kids/forms
```

## Quick Start

### Basic Form with Validation

```tsx
import React from 'react';
import { useFormValidation, FormField, FormInput, loginSchema, type LoginFormData } from '@kids/forms';
import { Button } from '@kids/ui-kit';

function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useFormValidation<LoginFormData>({
    schema: loginSchema,
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    console.log('Form data:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormField label="邮箱" error={errors.email} required>
        <FormInput
          {...register('email')}
          type="email"
          placeholder="请输入邮箱地址"
        />
      </FormField>

      <FormField label="密码" error={errors.password} required>
        <FormInput
          {...register('password')}
          type="password"
          placeholder="请输入密码"
        />
      </FormField>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '登录中...' : '登录'}
      </Button>
    </form>
  );
}
```

## Available Schemas

### Authentication
- `loginSchema` - User login form
- `registrationSchema` - User registration form
- `passwordResetSchema` - Password reset request
- `newPasswordSchema` - New password setting

### Course Management
- `courseCreateSchema` - Course creation form
- `courseUpdateSchema` - Course update form
- `lessonCreateSchema` - Lesson creation form
- `assignmentCreateSchema` - Assignment creation form

### Profile Management
- `studentProfileSchema` - Student profile form
- `parentProfileSchema` - Parent profile form
- `teacherProfileSchema` - Teacher profile form

## Components

### FormField
Wrapper component that provides consistent styling and error handling.

```tsx
<FormField
  label="Field Label"
  error={errors.fieldName}
  required
  helpText="Optional help text"
>
  <FormInput {...register('fieldName')} />
</FormField>
```

### FormInput
Styled input component with validation support.

```tsx
<FormInput
  {...register('fieldName')}
  type="email"
  placeholder="Enter email"
  disabled={isSubmitting}
/>
```

### FormTextarea
Styled textarea component for multi-line input.

```tsx
<FormTextarea
  {...register('description')}
  placeholder="Enter description"
  rows={4}
/>
```

### FormSelect
Styled select component with options support.

```tsx
<FormSelect
  {...register('category')}
  options={[
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
  ]}
  placeholder="Select an option"
/>
```

### FormCheckbox
Styled checkbox component.

```tsx
<FormCheckbox
  {...register('agreeToTerms')}
  label="I agree to the terms and conditions"
/>
```

## Hooks

### useFormValidation
Main hook that integrates React Hook Form with Zod validation.

```tsx
const {
  register,
  handleSubmit,
  formState: { errors, isSubmitting },
  watch,
  setValue,
  reset,
} = useFormValidation<FormData>({
  schema: yourZodSchema,
  defaultValues: {
    // your default values
  },
});
```

### useFieldValidation
Helper hook for field-specific validation.

```tsx
const {
  field,
  fieldState,
  isFieldValid,
  // ... other form methods
} = useFieldValidation('fieldName', yourZodSchema);
```

## Custom Schemas

You can create custom schemas using Zod:

```tsx
import { z } from 'zod';

const customSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  age: z.number().min(18, 'Must be at least 18 years old'),
});

type CustomFormData = z.infer<typeof customSchema>;
```

## Styling

The package includes built-in CSS styles that work with the design system. Import the styles in your app:

```tsx
import '@kids/forms'; // This imports the CSS automatically
```

## Examples

See the example forms in the apps:
- `apps/student-app/src/components/LoginForm.tsx`
- `apps/parent-app/src/components/ViewRequestForm.tsx`
- `apps/teacher-app/src/components/CourseCreateForm.tsx`
