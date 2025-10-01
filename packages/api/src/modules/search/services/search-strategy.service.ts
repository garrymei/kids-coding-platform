import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { randomBytes } from 'crypto';

export enum SearchVisibility {
  PRIVATE = 'private', // 默认不可搜索
  SCHOOL_ONLY = 'school_only', // 仅同校可见
  ANONYMOUS_ID = 'anonymous_id', // 仅知道匿名ID可搜索
  PUBLIC = 'public', // 完全公开（不推荐）
}

export interface SearchResult {
  id: string;
  anonymousId: string;
  nickname: string;
  school?: string;
  className?: string;
  visibility: SearchVisibility;
  // 去标识化信息
  maskedNickname: string;
  schoolSummary: string;
}

@Injectable()
export class SearchStrategyService {
  constructor(private readonly prisma: PrismaService) {}

  // 生成匿名ID
  generateAnonymousId(): string {
    return 'S-' + randomBytes(3).toString('hex').toUpperCase();
  }

  // 更新学生搜索可见性设置
  async updateSearchVisibility(
    studentId: string,
    visibility: SearchVisibility,
    options?: {
      nickname?: string;
      school?: string;
      className?: string;
    },
  ) {
    const student = await this.prisma.user.findUnique({
      where: { id: studentId }
    });

    if (!student || student.role !== 'student') {
      throw new BadRequestException('用户不是学生');
    }

    // 生成匿名ID（如果需要）
    let anonymousId = null;
    if (visibility !== SearchVisibility.PRIVATE) {
      anonymousId = this.generateAnonymousId();
    }

    // 更新用户搜索设置
    const updateData: any = {
      discoverable: visibility !== SearchVisibility.PRIVATE};

    if (options?.nickname) {
      updateData.nickname = options.nickname;
    }
    if (options?.school) {
      updateData.school = options.school;
    }
    if (options?.className) {
      updateData.className = options.className;
    }

    // 这里需要在User模型中添加anonymousId和searchVisibility字段
    // updateData.anonymousId = anonymousId;
    // updateData.searchVisibility = visibility;

    await this.prisma.user.update({
      where: { id: studentId },
      data: updateData});

    // 记录审计日志
    await this.prisma.auditLog.create({
      data: {
        actorId: studentId,
        action: 'update_search_visibility',
        targetType: 'user',
        targetId: studentId,
        metadata: {
          oldVisibility: 'private', // 这里应该从数据库获取
          newVisibility: visibility,
          anonymousId}}});

    return {
      anonymousId,
      visibility,
      message: this.getVisibilityMessage(visibility)};
  }

  // 获取可见性说明信息
  private getVisibilityMessage(visibility: SearchVisibility): string {
    switch (visibility) {
      case SearchVisibility.PRIVATE:
        return '您已设置为不可被搜索，其他人无法通过搜索找到您';
      case SearchVisibility.SCHOOL_ONLY:
        return '您已设置为仅同校可见，只有同校的家长和老师可以搜索到您';
      case SearchVisibility.ANONYMOUS_ID:
        return '您已设置为匿名ID可见，只有知道您匿名ID的人可以搜索到您';
      case SearchVisibility.PUBLIC:
        return '⚠️ 您已设置为完全公开，平台上的所有家长和老师都可以搜索到您，请谨慎考虑';
      default:
        return '';
    }
  }

  // 获取公开性警告信息
  getPublicVisibilityWarning(): {
    title: string;
    content: string[];
    risks: string[];
    benefits: string[];
  } {
    return {
      title: '完全公开搜索功能说明',
      content: [
        '开启后，平台上的所有家长和老师都可以通过搜索找到您',
        '搜索时只会显示您的昵称和学校信息，不会暴露真实姓名',
        '您可以随时关闭此功能，关闭后立即生效',
        '即使开启了搜索，其他人也需要您的同意才能关注您',
        '您可以随时撤销任何人的关注权限',
      ],
      risks: [
        '可能被不熟悉的人搜索到',
        '需要谨慎设置昵称和学校信息',
        '可能收到更多的关注申请',
      ],
      benefits: ['方便家长和老师找到您', '提高建立关注关系的效率']};
  }

  // 检查搜索权限
  async checkSearchPermission(
    searcherId: string,
    targetStudentId: string,
    searchType: 'nickname' | 'anonymous_id',
  ): Promise<boolean> {
    const searcher = await this.prisma.user.findUnique({
      where: { id: searcherId }
    });

    if (!searcher) {
      return false;
    }

    // 只有家长和教师可以搜索
    if (!['parent', 'teacher'].includes(searcher.role)) {
      return false;
    }

    const targetStudent = await this.prisma.user.findUnique({
      where: { id: targetStudentId }
    });

    if (!targetStudent || targetStudent.role !== 'student') {
      return false;
    }

    // 检查是否已建立关系
    const existingRelationship = await this.prisma.relationship.findFirst({
      where: {
        studentId: targetStudentId,
        partyId: searcherId,
        status: { in: ['ACTIVE', 'PENDING'] }}});

    if (existingRelationship) {
      return false; // 已建立关系，不需要搜索
    }

    // 检查学生搜索可见性设置
    if (!targetStudent.discoverable) {
      return false; // 学生设置为不可搜索
    }

    // 这里需要根据实际的搜索可见性设置进行更详细的检查
    // 比如检查是否同校、是否知道匿名ID等

    return true;
  }

  // 过滤搜索结果
  async filterSearchResults(
    results: any[],
    searcherId: string,
    searchType: 'nickname' | 'anonymous_id',
  ): Promise<SearchResult[]> {
    const searcher = await this.prisma.user.findUnique({
      where: { id: searcherId }
    });

    if (!searcher) {
      return [];
    }

    return results.map((student) => ({
      id: student.id,
      anonymousId: student.anonymousId || this.generateAnonymousId(),
      nickname: student.nickname,
      school: student.school,
      className: student.className,
      visibility: student.searchVisibility || SearchVisibility.PRIVATE,
      // 去标识化处理
      maskedNickname: this.maskNickname(student.nickname),
      schoolSummary: this.getSchoolSummary(student.school, student.className)}));
  }

  // 掩码昵称
  private maskNickname(nickname: string): string {
    if (!nickname || nickname.length <= 2) {
      return nickname;
    }

    if (nickname.length <= 4) {
      return (
        nickname[0] +
        '*'.repeat(nickname.length - 2) +
        nickname[nickname.length - 1]
      );
    }

    return (
      nickname[0] +
      '*'.repeat(nickname.length - 2) +
      nickname[nickname.length - 1]
    );
  }

  // 获取学校摘要
  private getSchoolSummary(school?: string, className?: string): string {
    if (!school) {
      return '未设置学校';
    }

    if (className) {
      return `${school} - ${className}`;
    }

    return school;
  }
}
