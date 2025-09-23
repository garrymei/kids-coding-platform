/**
 * Constants for Kids Coding Platform
 */

/**
 * Application constants
 */
export const APP_CONSTANTS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_CODE_LENGTH: 10000,
  MAX_EXECUTION_TIME: 30000, // 30 seconds
  DEFAULT_PAGE_SIZE: 20,
} as const;

/**
 * API endpoints
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },
  USERS: {
    PROFILE: '/users/profile',
    UPDATE: '/users/update',
  },
  COURSES: {
    LIST: '/courses',
    DETAIL: '/courses/:id',
    PROGRESS: '/courses/:id/progress',
  },
} as const;

/**
 * User roles
 */
export const USER_ROLES = {
  STUDENT: 'student',
  PARENT: 'parent',
  TEACHER: 'teacher',
  ADMIN: 'admin',
} as const;

/**
 * Learning levels
 */
export const LEARNING_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
} as const;
