import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export interface MaskingConfig {
  showFullName: boolean;
  showSchool: boolean;
  showClassName: boolean;
  showAvatar: boolean;
  showEmail: boolean;
  showPhone: boolean;
  anonymizeId: boolean;
}

export interface StudentSearchResult {
  id: string;
  nickname: string;
  school?: string;
  className?: string;
  avatar?: string;
  anonymousId: string;
  discoverable: boolean;
  masked: boolean;
}

@Injectable()
export class DataMaskingService {
  constructor(private readonly prisma: PrismaService) {}

  // 根据用户角色和关系获取脱敏配置
  async getMaskingConfig(
    requesterId: string,
    targetStudentId: string,
  ): Promise<MaskingConfig> {
    const requester = await this.prisma.user.findUnique({
      where: { id: requesterId }
    });

    if (!requester) {
      return this.getDefaultMaskingConfig();
    }

    // 如果是学生本人，显示完整信息
    if (requesterId === targetStudentId) {
      return {
        showFullName: true,
        showSchool: true,
        showClassName: true,
        showAvatar: true,
        showEmail: true,
        showPhone: true,
        anonymizeId: false};
    }

    // 检查是否有授权关系
    const relationship = await this.prisma.relationship.findFirst({
      where: {
        studentId: targetStudentId,
        partyId: requesterId,
        status: 'ACTIVE'}});

    // 检查是否是同班级的教师
    const classRelationship = await this.prisma.classEnrollment.findFirst({
      where: {
        studentId: targetStudentId,
        class: {
          teacherId: requesterId,
          status: 'ACTIVE'},
        status: 'ACTIVE'}});

    if (relationship || classRelationship) {
      // 有授权关系，根据角色显示不同信息
      if (requester.role === 'parent') {
        return {
          showFullName: true,
          showSchool: true,
          showClassName: true,
          showAvatar: true,
          showEmail: false,
          showPhone: false,
          anonymizeId: false};
      } else if (requester.role === 'teacher') {
        return {
          showFullName: true,
          showSchool: true,
          showClassName: true,
          showAvatar: true,
          showEmail: false,
          showPhone: false,
          anonymizeId: false};
      }
    }

    // 默认脱敏配置
    return this.getDefaultMaskingConfig();
  }

  // 获取默认脱敏配置
  private getDefaultMaskingConfig(): MaskingConfig {
    return {
      showFullName: false,
      showSchool: false,
      showClassName: false,
      showAvatar: false,
      showEmail: false,
      showPhone: false,
      anonymizeId: true};
  }

  // 脱敏学生搜索结果
  async maskStudentSearchResults(
    students: any[],
    requesterId: string,
  ): Promise<StudentSearchResult[]> {
    const maskedResults: StudentSearchResult[] = [];

    for (const student of students) {
      const config = await this.getMaskingConfig(requesterId, student.id);
      const maskedStudent = this.applyMasking(student, config);
      maskedResults.push(maskedStudent);
    }

    return maskedResults;
  }

  // 应用脱敏规则
  private applyMasking(
    student: any,
    config: MaskingConfig,
  ): StudentSearchResult {
    return {
      id: student.id,
      nickname: config.showFullName
        ? student.displayName
        : this.maskName(student.displayName),
      school: config.showSchool
        ? student.school
        : this.maskSchool(student.school),
      className: config.showClassName
        ? student.className
        : this.maskClassName(student.className),
      avatar: config.showAvatar ? student.avatar : null,
      anonymousId: student.anonymousId,
      discoverable: student.discoverable,
      masked: !config.showFullName};
  }

  // 脱敏姓名
  private maskName(name: string): string {
    if (!name) return '***';

    if (name.length <= 2) {
      return name.charAt(0) + '*';
    }

    return (
      name.charAt(0) +
      '*'.repeat(name.length - 2) +
      name.charAt(name.length - 1)
    );
  }

  // 脱敏学校信息
  private maskSchool(school: string): string {
    if (!school) return '***';

    if (school.length <= 4) {
      return school.charAt(0) + '*'.repeat(school.length - 1);
    }

    return (
      school.substring(0, 2) +
      '*'.repeat(school.length - 4) +
      school.substring(school.length - 2)
    );
  }

  // 脱敏班级信息
  private maskClassName(className: string): string {
    if (!className) return '***';

    // 保留年级信息，脱敏班级号
    const match = className.match(/^(.+?)(\d+)(.+)$/);
    if (match) {
      const [, prefix, number, suffix] = match;
      return prefix + '*'.repeat(number.length) + suffix;
    }

    return className.charAt(0) + '*'.repeat(className.length - 1);
  }

  // 脱敏邮箱
  private maskEmail(email: string): string {
    if (!email) return '***';

    const [localPart, domain] = email.split('@');
    if (!domain) return '***';

    const maskedLocal =
      localPart.length > 2
        ? localPart.charAt(0) +
          '*'.repeat(localPart.length - 2) +
          localPart.charAt(localPart.length - 1)
        : localPart.charAt(0) + '*';

    return `${maskedLocal}@${domain}`;
  }

  // 脱敏手机号
  private maskPhone(phone: string): string {
    if (!phone) return '***';

    if (phone.length >= 11) {
      return phone.substring(0, 3) + '****' + phone.substring(7);
    }

    return (
      phone.charAt(0) +
      '*'.repeat(phone.length - 2) +
      phone.charAt(phone.length - 1)
    );
  }

  // 生成匿名ID
  generateAnonymousId(): string {
    const prefix = 'S-';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = prefix;

    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  }

  // 验证匿名ID格式
  validateAnonymousId(anonymousId: string): boolean {
    const pattern = /^S-[A-Z0-9]{6}$/;
    return pattern.test(anonymousId);
  }

  // 脱敏敏感数据字段
  maskSensitiveFields(data: any, fields: string[]): any {
    const masked = { ...data };

    fields.forEach((field) => {
      if (masked[field]) {
        switch (field) {
          case 'email':
            masked[field] = this.maskEmail(masked[field]);
            break;
          case 'phone':
            masked[field] = this.maskPhone(masked[field]);
            break;
          case 'displayName':
            masked[field] = this.maskName(masked[field]);
            break;
          case 'school':
            masked[field] = this.maskSchool(masked[field]);
            break;
          case 'className':
            masked[field] = this.maskClassName(masked[field]);
            break;
          default:
            masked[field] = '***';
        }
      }
    });

    return masked;
  }

  // 检查学生是否允许被搜索
  async checkStudentSearchability(
    studentId: string,
    searchType: 'name' | 'anonymous_id',
  ): Promise<boolean> {
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      select: {
        discoverable: true,
        anonymousId: true}});

    if (!student) {
      return false;
    }

    // 如果学生不允许被搜索，直接返回false
    if (!student.discoverable) {
      return false;
    }

    // 如果是匿名ID搜索，需要验证匿名ID
    if (searchType === 'anonymous_id') {
      return this.validateAnonymousId(student.anonymousId);
    }

    return true;
  }

  // 获取学生搜索可见性设置
  async getStudentSearchVisibility(studentId: string): Promise<{
    discoverable: boolean;
    searchBy: string[];
    anonymousId: string;
  }> {
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      select: {
        discoverable: true,
        anonymousId: true,
        school: true,
        className: true}});

    if (!student) {
      throw new Error('学生不存在');
    }

    const searchBy: string[] = [];

    if (student.discoverable) {
      if (student.school) {
        searchBy.push('school');
      }
      if (student.className) {
        searchBy.push('class');
      }
      searchBy.push('anonymous_id');
    }

    return {
      discoverable: student.discoverable,
      searchBy,
      anonymousId: student.anonymousId};
  }

  // 更新学生搜索可见性设置
  async updateStudentSearchVisibility(
    studentId: string,
    settings: {
      discoverable: boolean;
      searchBy?: string[];
    },
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: studentId },
      data: {
        discoverable: settings.discoverable}});

    // 记录设置变更
    await this.prisma.auditLog.create({
      data: {
        actorId: studentId,
        action: 'update_search_visibility',
        targetType: 'user',
        targetId: studentId,
        metadata: {
          discoverable: settings.discoverable,
          searchBy: settings.searchBy,
          timestamp: new Date().toISOString()}}});
  }
}
