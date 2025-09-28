/**
 * 统一指标定义和计算口径
 */

// 指标维度定义
export type MetricDimension = 
  | 'study_minutes'      // 学习时长（分钟）
  | 'levels_completed'   // 完成关卡数
  | 'retry_count'        // 重试次数
  | 'accuracy'           // 判题通过率
  | 'streak_days';       // 连续学习天数

// 时间周期定义
export type TimePeriod = 'daily' | 'weekly';

// 数据点结构
export interface DataPoint {
  t: string;  // 时间戳 (YYYY-MM-DD)
  v: number;  // 数值
}

// 指标系列结构
export interface MetricSeries {
  dim: MetricDimension;
  points: DataPoint[];
}

// 趋势查询参数
export interface TrendQueryParams {
  studentId: string;
  dims: MetricDimension[];
  period: TimePeriod;
  from: string;  // YYYY-MM-DD
  to: string;    // YYYY-MM-DD
}

// 趋势响应结构
export interface TrendResponse {
  studentId: string;
  period: TimePeriod;
  series: MetricSeries[];
}

// 对比查询参数
export interface CompareQueryParams {
  classId: string;
  dims: MetricDimension[];
  period: TimePeriod;
  week: string;  // YYYY-MM-DD (周一的日期)
}

// 对比数据行
export interface CompareDataRow {
  studentId: string;
  name: string;
  [key: string]: string | number;  // 动态指标字段
}

// 对比响应结构
export interface CompareResponse {
  classId: string;
  period: TimePeriod;
  bucket: string;  // 时间桶
  rows: CompareDataRow[];
}

// 计算口径配置
export interface CalculationConfig {
  // accuracy 计算方式
  accuracyCalculation: {
    // 是否去重同一关的最后一次尝试
    deduplicateLastAttempt: boolean;
    // 是否以尝试为粒度
    attemptBased: boolean;
  };
  
  // 时间周期配置
  timePeriods: {
    weekly: {
      // 自然周（周一至周日）
      naturalWeek: boolean;
    };
  };
}

// 默认计算配置
export const DEFAULT_CALCULATION_CONFIG: CalculationConfig = {
  accuracyCalculation: {
    deduplicateLastAttempt: true,
    attemptBased: true,
  },
  timePeriods: {
    weekly: {
      naturalWeek: true,
    },
  },
};

// 指标元数据
export const METRIC_METADATA: Record<MetricDimension, {
  name: string;
  unit: string;
  description: string;
  calculation: string;
}> = {
  study_minutes: {
    name: '学习时长',
    unit: '分钟',
    description: '学生在平台上的学习时间',
    calculation: '累计学习时间（分钟）',
  },
  levels_completed: {
    name: '完成关卡数',
    unit: '个',
    description: '学生完成的关卡数量',
    calculation: '累计完成关卡数',
  },
  retry_count: {
    name: '重试次数',
    unit: '次',
    description: '学生重试关卡的总次数',
    calculation: '累计重试次数',
  },
  accuracy: {
    name: '判题通过率',
    unit: '%',
    description: '学生判题通过的比例',
    calculation: '通过关卡次数 / 总尝试次数',
  },
  streak_days: {
    name: '连续学习天数',
    unit: '天',
    description: '学生连续学习的天数',
    calculation: '由 progress 计算',
  },
};
