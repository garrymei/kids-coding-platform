import { z } from 'zod';

// Course creation schema
export const courseCreateSchema = z.object({
  title: z
    .string()
    .min(1, '课程标题不能为空')
    .max(100, '课程标题不能超过100个字符'),
  description: z
    .string()
    .min(10, '课程描述至少需要10个字符')
    .max(1000, '课程描述不能超过1000个字符'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced'], {
    required_error: '请选择难度等级',
  }),
  tags: z
    .array(z.string())
    .min(1, '至少需要添加一个标签')
    .max(5, '最多只能添加5个标签'),
  estimatedDuration: z
    .number()
    .int()
    .min(1, '预计时长必须大于0')
    .max(480, '预计时长不能超过480分钟'),
  isPublic: z.boolean().default(true),
});

export type CourseCreateFormData = z.infer<typeof courseCreateSchema>;

// Course update schema
export const courseUpdateSchema = courseCreateSchema.partial();

export type CourseUpdateFormData = z.infer<typeof courseUpdateSchema>;

// Lesson creation schema
export const lessonCreateSchema = z.object({
  title: z
    .string()
    .min(1, '课时标题不能为空')
    .max(100, '课时标题不能超过100个字符'),
  description: z
    .string()
    .min(10, '课时描述至少需要10个字符')
    .max(500, '课时描述不能超过500个字符'),
  content: z
    .string()
    .min(20, '课时内容至少需要20个字符')
    .max(10000, '课时内容不能超过10000个字符'),
  order: z
    .number()
    .int()
    .min(0, '排序不能小于0'),
  estimatedDuration: z
    .number()
    .int()
    .min(1, '预计时长必须大于0')
    .max(120, '预计时长不能超过120分钟'),
  isPublished: z.boolean().default(false),
});

export type LessonCreateFormData = z.infer<typeof lessonCreateSchema>;

// Assignment creation schema
export const assignmentCreateSchema = z.object({
  title: z
    .string()
    .min(1, '作业标题不能为空')
    .max(100, '作业标题不能超过100个字符'),
  description: z
    .string()
    .min(10, '作业描述至少需要10个字符')
    .max(1000, '作业描述不能超过1000个字符'),
  instructions: z
    .string()
    .min(20, '作业说明至少需要20个字符')
    .max(5000, '作业说明不能超过5000个字符'),
  dueDate: z
    .date()
    .min(new Date(), '截止日期不能早于今天'),
  maxAttempts: z
    .number()
    .int()
    .min(1, '最大尝试次数至少为1')
    .max(10, '最大尝试次数不能超过10')
    .default(3),
  points: z
    .number()
    .int()
    .min(1, '分数至少为1')
    .max(1000, '分数不能超过1000')
    .default(100),
});

export type AssignmentCreateFormData = z.infer<typeof assignmentCreateSchema>;
