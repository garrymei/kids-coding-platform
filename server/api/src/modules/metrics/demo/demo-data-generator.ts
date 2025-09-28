import { 
  MetricDimension, 
  DataPoint, 
  MetricSeries, 
  TrendResponse, 
  CompareResponse,
  CompareDataRow,
  TimePeriod 
} from '../types/metrics.types';

/**
 * 基于 studentId hash 生成稳定的伪数据
 */
export class DemoDataGenerator {
  private readonly seed: number;

  constructor(studentId: string) {
    this.seed = this.hashString(studentId);
  }

  /**
   * 生成趋势数据
   */
  generateTrendData(
    studentId: string,
    dims: MetricDimension[],
    period: TimePeriod,
    from: string,
    to: string
  ): TrendResponse {
    const series: MetricSeries[] = dims.map(dim => ({
      dim,
      points: this.generateDataPoints(dim, period, from, to)
    }));

    return {
      studentId,
      period,
      series
    };
  }

  /**
   * 生成对比数据
   */
  generateCompareData(
    classId: string,
    dims: MetricDimension[],
    period: TimePeriod,
    week: string,
    studentCount: number = 10
  ): CompareResponse {
    const rows: CompareDataRow[] = [];
    
    for (let i = 0; i < studentCount; i++) {
      const studentId = `stu_${i + 1}`;
      const name = this.generateStudentName(i);
      
      const row: CompareDataRow = {
        studentId,
        name
      };

      // 为每个维度生成数据
      dims.forEach(dim => {
        row[dim] = this.generateMetricValue(dim, i);
      });

      rows.push(row);
    }

    // 按 levels_completed 降序排序
    rows.sort((a, b) => (b.levels_completed as number) - (a.levels_completed as number));

    return {
      classId,
      period,
      bucket: week,
      rows
    };
  }

  /**
   * 生成数据点
   */
  private generateDataPoints(
    dim: MetricDimension,
    period: TimePeriod,
    from: string,
    to: string
  ): DataPoint[] {
    const points: DataPoint[] = [];
    const startDate = new Date(from);
    const endDate = new Date(to);
    
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const value = this.generateMetricValue(dim, this.getDateIndex(currentDate, period));
      
      points.push({
        t: dateStr,
        v: value
      });

      // 根据周期递增日期
      if (period === 'daily') {
        currentDate.setDate(currentDate.getDate() + 1);
      } else {
        currentDate.setDate(currentDate.getDate() + 7);
      }
    }

    return points;
  }

  /**
   * 生成指标值
   */
  private generateMetricValue(dim: MetricDimension, index: number): number {
    const random = this.seededRandom(index);
    
    switch (dim) {
      case 'study_minutes':
        // 学习时长：30-180分钟，有学习习惯的学生
        return Math.round(30 + random * 150);
        
      case 'levels_completed':
        // 完成关卡数：1-15个，递增趋势
        return Math.round(1 + random * 14 + index * 0.5);
        
      case 'retry_count':
        // 重试次数：0-10次，与完成关卡数负相关
        return Math.round(random * 10);
        
      case 'accuracy':
        // 判题通过率：0.4-0.95，大部分在0.6-0.9之间
        return Math.round((0.4 + random * 0.55) * 100) / 100;
        
      case 'streak_days':
        // 连续学习天数：1-30天
        return Math.round(1 + random * 29);
        
      default:
        return 0;
    }
  }

  /**
   * 生成学生姓名
   */
  private generateStudentName(index: number): string {
    const names = [
      '小明', '小红', '小刚', '小丽', '小华', '小强', '小美', '小亮',
      '小芳', '小军', '小燕', '小伟', '小敏', '小东', '小霞', '小杰'
    ];
    return names[index % names.length];
  }

  /**
   * 获取日期索引（用于生成稳定的数据）
   */
  private getDateIndex(date: Date, period: TimePeriod): number {
    if (period === 'daily') {
      return Math.floor((date.getTime() - new Date('2025-01-01').getTime()) / (1000 * 60 * 60 * 24));
    } else {
      return Math.floor((date.getTime() - new Date('2025-01-01').getTime()) / (1000 * 60 * 60 * 24 * 7));
    }
  }

  /**
   * 基于种子的随机数生成器
   */
  private seededRandom(index: number): number {
    const x = Math.sin(this.seed + index) * 10000;
    return x - Math.floor(x);
  }

  /**
   * 字符串哈希函数
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash);
  }
}

/**
 * 生成班级学生列表
 */
export function generateClassStudents(classId: string, count: number = 10): Array<{
  studentId: string;
  name: string;
  email: string;
}> {
  const students = [];
  const names = [
    '小明', '小红', '小刚', '小丽', '小华', '小强', '小美', '小亮',
    '小芳', '小军', '小燕', '小伟', '小敏', '小东', '小霞', '小杰'
  ];

  for (let i = 0; i < count; i++) {
    students.push({
      studentId: `stu_${i + 1}`,
      name: names[i % names.length],
      email: `student${i + 1}@example.com`
    });
  }

  return students;
}
