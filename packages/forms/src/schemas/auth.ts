import { z } from 'zod';

// Login form schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, '邮箱不能为空')
    .email('请输入有效的邮箱地址'),
  password: z
    .string()
    .min(6, '密码至少需要6个字符')
    .max(100, '密码不能超过100个字符'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Registration form schema
export const registrationSchema = z.object({
  email: z
    .string()
    .min(1, '邮箱不能为空')
    .email('请输入有效的邮箱地址'),
  password: z
    .string()
    .min(8, '密码至少需要8个字符')
    .max(100, '密码不能超过100个字符')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '密码必须包含大小写字母和数字'),
  confirmPassword: z.string().min(1, '请确认密码'),
  displayName: z
    .string()
    .min(2, '姓名至少需要2个字符')
    .max(50, '姓名不能超过50个字符'),
  role: z.enum(['student', 'parent', 'teacher'], {
    required_error: '请选择角色',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
});

export type RegistrationFormData = z.infer<typeof registrationSchema>;

// Password reset schema
export const passwordResetSchema = z.object({
  email: z
    .string()
    .min(1, '邮箱不能为空')
    .email('请输入有效的邮箱地址'),
});

export type PasswordResetFormData = z.infer<typeof passwordResetSchema>;

// New password schema
export const newPasswordSchema = z.object({
  password: z
    .string()
    .min(8, '密码至少需要8个字符')
    .max(100, '密码不能超过100个字符')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '密码必须包含大小写字母和数字'),
  confirmPassword: z.string().min(1, '请确认密码'),
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
});

export type NewPasswordFormData = z.infer<typeof newPasswordSchema>;
