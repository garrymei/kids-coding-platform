import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';

/**
 * 指标数据权限验证服务
 * 教师访问 compare 必须 teacherId 是该 classId 的拥有者
 * 家长仅能访问自己已授权学生的趋势
 */
@Injectable()
export class MetricsAuthService {
  
  /**
   * 验证教师对班级的访问权限
   */
  async validateTeacherClassAccess(teacherId: string, classId: string): Promise<boolean> {
    // TODO: 从数据库查询教师是否拥有该班级
    // 这里使用模拟数据
    const teacherClasses = await this.getTeacherClasses(teacherId);
    return teacherClasses.includes(classId);
  }

  /**
   * 验证家长对学生的访问权限
   */
  async validateParentStudentAccess(parentId: string, studentId: string): Promise<boolean> {
    // TODO: 从数据库查询家长是否已获得该学生的授权
    // 这里使用模拟数据
    const authorizedStudents = await this.getParentAuthorizedStudents(parentId);
    return authorizedStudents.includes(studentId);
  }

  /**
   * 验证用户对指标数据的访问权限
   */
  async validateMetricsAccess(
    userId: string, 
    userRole: 'teacher' | 'parent' | 'student',
    resourceType: 'trend' | 'compare',
    resourceId: string
  ): Promise<boolean> {
    switch (userRole) {
      case 'teacher':
        if (resourceType === 'compare') {
          return await this.validateTeacherClassAccess(userId, resourceId);
        }
        // 教师可以访问所有趋势数据（用于教学分析）
        return true;
        
      case 'parent':
        if (resourceType === 'trend') {
          return await this.validateParentStudentAccess(userId, resourceId);
        }
        // 家长不能访问班级对比数据
        return false;
        
      case 'student':
        // 学生只能访问自己的数据
        return userId === resourceId;
        
      default:
        return false;
    }
  }

  /**
   * 获取教师的班级列表（模拟数据）
   */
  private async getTeacherClasses(teacherId: string): Promise<string[]> {
    // 模拟数据：教师拥有的班级
    const mockData: Record<string, string[]> = {
      'teacher_1': ['cls_1', 'cls_2'],
      'teacher_2': ['cls_3'],
      'teacher_3': ['cls_4', 'cls_5', 'cls_6']
    };
    
    return mockData[teacherId] || [];
  }

  /**
   * 获取家长已授权的学生列表（模拟数据）
   */
  private async getParentAuthorizedStudents(parentId: string): Promise<string[]> {
    // 模拟数据：家长已授权的学生
    const mockData: Record<string, string[]> = {
      'parent_1': ['stu_1', 'stu_2'],
      'parent_2': ['stu_3'],
      'parent_3': ['stu_4', 'stu_5']
    };
    
    return mockData[parentId] || [];
  }

  /**
   * 检查并抛出权限异常
   */
  async checkMetricsAccess(
    userId: string,
    userRole: 'teacher' | 'parent' | 'student',
    resourceType: 'trend' | 'compare',
    resourceId: string
  ): Promise<void> {
    const hasAccess = await this.validateMetricsAccess(userId, userRole, resourceType, resourceId);
    
    if (!hasAccess) {
      if (userRole === 'parent' && resourceType === 'compare') {
        throw new ForbiddenException('家长无权访问班级对比数据');
      }
      
      if (userRole === 'parent' && resourceType === 'trend') {
        throw new ForbiddenException('家长无权访问该学生的学习数据');
      }
      
      if (userRole === 'teacher' && resourceType === 'compare') {
        throw new ForbiddenException('教师无权访问该班级的数据');
      }
      
      throw new UnauthorizedException('无权访问该资源');
    }
  }

  /**
   * 获取用户角色（模拟实现）
   */
  async getUserRole(userId: string): Promise<'teacher' | 'parent' | 'student'> {
    // 模拟数据：根据用户ID前缀判断角色
    if (userId.startsWith('teacher_')) {
      return 'teacher';
    } else if (userId.startsWith('parent_')) {
      return 'parent';
    } else if (userId.startsWith('stu_')) {
      return 'student';
    }
    
    throw new UnauthorizedException('未知用户角色');
  }
}
