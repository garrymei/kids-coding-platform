import { z } from 'zod';

// Student profile schema
export const studentProfileSchema = z.object({
  displayName: z
    .string()
    .min(2, '姓名至少需要2个字符')
    .max(50, '姓名不能超过50个字符'),
  avatar: z
    .string()
    .url('头像必须是有效的URL')
    .optional()
    .or(z.literal('')),
  grade: z
    .number()
    .int()
    .min(1, '年级至少为1')
    .max(12, '年级不能超过12')
    .optional(),
  interests: z
    .array(z.string())
    .max(10, '最多只能选择10个兴趣标签')
    .default([]),
  parentEmail: z
    .string()
    .email('请输入有效的家长邮箱')
    .optional()
    .or(z.literal('')),
  timezone: z
    .string()
    .min(1, '请选择时区')
    .default('Asia/Shanghai'),
});

export type StudentProfileFormData = z.infer<typeof studentProfileSchema>;

// Parent profile schema
export const parentProfileSchema = z.object({
  displayName: z
    .string()
    .min(2, '姓名至少需要2个字符')
    .max(50, '姓名不能超过50个字符'),
  avatar: z
    .string()
    .url('头像必须是有效的URL')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .regex(/^1[3-9]\d{9}$/, '请输入有效的手机号码')
    .optional()
    .or(z.literal('')),
  children: z
    .array(z.object({
      id: z.string(),
      name: z.string(),
      email: z.string().email(),
    }))
    .default([]),
  timezone: z
    .string()
    .min(1, '请选择时区')
    .default('Asia/Shanghai'),
});

export type ParentProfileFormData = z.infer<typeof parentProfileSchema>;

// Teacher profile schema
export const teacherProfileSchema = z.object({
  displayName: z
    .string()
    .min(2, '姓名至少需要2个字符')
    .max(50, '姓名不能超过50个字符'),
  avatar: z
    .string()
    .url('头像必须是有效的URL')
    .optional()
    .or(z.literal('')),
  bio: z
    .string()
    .min(10, '个人简介至少需要10个字符')
    .max(500, '个人简介不能超过500个字符')
    .optional()
    .or(z.literal('')),
  subjects: z
    .array(z.string())
    .min(1, '至少需要选择一个教学科目')
    .max(5, '最多只能选择5个教学科目'),
  experience: z
    .number()
    .int()
    .min(0, '教学经验不能为负数')
    .max(50, '教学经验不能超过50年')
    .optional(),
  phone: z
    .string()
    .regex(/^1[3-9]\d{9}$/, '请输入有效的手机号码')
    .optional()
    .or(z.literal('')),
  timezone: z
    .string()
    .min(1, '请选择时区')
    .default('Asia/Shanghai'),
});

export type TeacherProfileFormData = z.infer<typeof teacherProfileSchema>;
