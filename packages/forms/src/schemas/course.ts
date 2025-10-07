import { z } from 'zod';

export const courseCreateSchema = z.object({
  title: z.string().min(1, '课程标题不能为空').max(100, '课程标题不能超过 100 个字符'),
  description: z
    .string()
    .min(10, '课程描述至少需要 10 个字符')
    .max(1000, '课程描述不能超过 1000 个字符'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced'], {
    required_error: '请选择课程难度',
  }),
  tags: z.array(z.string()).min(1, '至少需要添加一个标签').max(5, '最多只能添加 5 个标签'),
  estimatedDuration: z
    .number()
    .int()
    .min(1, '预计时长必须大于 0 分钟')
    .max(480, '预计时长不能超过 480 分钟'),
  isPublic: z.boolean(),
});

export type CourseCreateFormData = z.infer<typeof courseCreateSchema>;

export const courseUpdateSchema = courseCreateSchema.partial();

export type CourseUpdateFormData = z.infer<typeof courseUpdateSchema>;

export const lessonCreateSchema = z.object({
  title: z.string().min(1, '课时标题不能为空').max(100, '课时标题不能超过 100 个字符'),
  description: z
    .string()
    .min(10, '课时描述至少需要 10 个字符')
    .max(500, '课时描述不能超过 500 个字符'),
  content: z
    .string()
    .min(20, '课时内容至少需要 20 个字符')
    .max(10000, '课时内容不能超过 10000 个字符'),
  order: z.number().int().min(0, '排序不能小于 0'),
  estimatedDuration: z
    .number()
    .int()
    .min(1, '预计时长必须大于 0 分钟')
    .max(120, '预计时长不能超过 120 分钟'),
  isPublished: z.boolean(),
});

export type LessonCreateFormData = z.infer<typeof lessonCreateSchema>;

export const assignmentCreateSchema = z.object({
  title: z.string().min(1, '作业标题不能为空').max(100, '作业标题不能超过 100 个字符'),
  description: z
    .string()
    .min(10, '作业描述至少需要 10 个字符')
    .max(1000, '作业描述不能超过 1000 个字符'),
  instructions: z
    .string()
    .min(20, '作业说明至少需要 20 个字符')
    .max(5000, '作业说明不能超过 5000 个字符'),
  dueDate: z.date().min(new Date(), '截止日期不能早于今天'),
  maxAttempts: z
    .number()
    .int()
    .min(1, '最大尝试次数至少为 1 次')
    .max(10, '最大尝试次数不能超过 10 次'),
  points: z.number().int().min(1, '分值至少为 1 分').max(1000, '分值不能超过 1000 分'),
});

export type AssignmentCreateFormData = z.infer<typeof assignmentCreateSchema>;
