import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { 
  UpdateSearchabilityDto, 
  SearchStudentDto, 
  CreateFollowRequestDto,
  GenerateShareCodeDto 
} from './dto/students.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  // 更新学生可搜索性设置
  async updateSearchability(studentId: string, updateDto: UpdateSearchabilityDto) {
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      include: { role: true },
    });

    if (!student) {
      throw new NotFoundException('学生不存在');
    }

    if (student.role.name !== 'student') {
      throw new BadRequestException('该用户不是学生');
    }

    // 生成匿名ID（如果开启搜索）
    let anonymousId = null;
    if (updateDto.isSearchable) {
      anonymousId = this.generateAnonymousId();
    }

    return this.prisma.user.update({
      where: { id: studentId },
      data: {
        // 这里需要在User模型中添加这些字段
        // isSearchable: updateDto.isSearchable,
        // searchNickname: updateDto.searchNickname,
        // schoolName: updateDto.schoolName,
        // className: updateDto.className,
        // anonymousId: anonymousId,
      },
    });
  }

  // 搜索可搜索的学生
  async searchStudents(searchDto: SearchStudentDto) {
    const where: any = {
      // isSearchable: true,
      // searchNickname: {
      //   contains: searchDto.nickname,
      //   mode: 'insensitive',
      // },
    };

    if (searchDto.schoolName) {
      // where.schoolName = {
      //   contains: searchDto.schoolName,
      //   mode: 'insensitive',
      // };
    }

    if (searchDto.className) {
      // where.className = {
      //   contains: searchDto.className,
      //   mode: 'insensitive',
      // };
    }

    const students = await this.prisma.user.findMany({
      where: {
        ...where,
        role: {
          name: 'student',
        },
      },
      select: {
        id: true,
        // anonymousId: true,
        // searchNickname: true,
        // schoolName: true,
        // className: true,
        displayName: true,
        // 不返回真实邮箱等敏感信息
      },
      take: 20, // 限制搜索结果数量
    });

    return students;
  }

  // 创建关注申请
  async createFollowRequest(requesterId: string, createDto: CreateFollowRequestDto) {
    // 通过匿名ID查找学生
    const student = await this.prisma.user.findFirst({
      where: {
        // anonymousId: createDto.studentAnonymousId,
        role: { name: 'student' },
      },
      include: { role: true },
    });

    if (!student) {
      throw new NotFoundException('未找到对应的学生');
    }

    // 检查是否已存在关系
    const existingRelationship = await this.prisma.relationship.findUnique({
      where: {
        studentId_partyId: {
          studentId: student.id,
          partyId: requesterId,
        },
      },
    });

    if (existingRelationship && existingRelationship.status === 'ACTIVE') {
      throw new ForbiddenException('您已经关注了该学生');
    }

    // 创建关注申请
    const followRequest = await this.prisma.consent.create({
      data: {
        studentId: student.id,
        requesterId,
        purpose: createDto.purpose,
        reason: createDto.reason,
        expiresAt: createDto.expiresAt ? new Date(createDto.expiresAt) : null,
        status: 'PENDING',
      },
      include: {
        student: {
          select: {
            id: true,
            displayName: true,
            // searchNickname: true,
            // schoolName: true,
            // className: true,
          },
        },
        requester: {
          select: {
            id: true,
            displayName: true,
            email: true,
            role: {
              select: { name: true },
            },
          },
        },
      },
    });

    return followRequest;
  }

  // 生成分享码
  async generateShareCode(studentId: string, generateDto: GenerateShareCodeDto) {
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      include: { role: true },
    });

    if (!student) {
      throw new NotFoundException('学生不存在');
    }

    if (student.role.name !== 'student') {
      throw new BadRequestException('该用户不是学生');
    }

    // 生成分享码
    const shareCode = this.generateShareCodeString();
    const expiresAt = generateDto.expiresAt ? new Date(generateDto.expiresAt) : null;

    // 这里需要创建一个分享码表来存储
    // const shareCodeRecord = await this.prisma.shareCode.create({
    //   data: {
    //     code: shareCode,
    //     studentId,
    //     purpose: generateDto.purpose,
    //     expiresAt,
    //     isActive: true,
    //   },
    // });

    return {
      shareCode,
      expiresAt,
      purpose: generateDto.purpose,
      qrCodeUrl: `/api/students/share-qr/${shareCode}`, // QR码生成接口
    };
  }

  // 通过分享码查找学生
  async findStudentByShareCode(shareCode: string) {
    // const shareCodeRecord = await this.prisma.shareCode.findFirst({
    //   where: {
    //     code: shareCode,
    //     isActive: true,
    //     OR: [
    //       { expiresAt: null },
    //       { expiresAt: { gt: new Date() } },
    //     ],
    //   },
    //   include: {
    //     student: {
    //       select: {
    //         id: true,
    //         displayName: true,
    //         // 只返回基本信息，不包含敏感数据
    //       },
    //     },
    //   },
    // });

    // if (!shareCodeRecord) {
    //   throw new NotFoundException('分享码无效或已过期');
    // }

    // return shareCodeRecord;

    // 临时返回模拟数据
    return {
      student: {
        id: 'temp-student-id',
        displayName: '示例学生',
      },
      purpose: 'parent-view',
      expiresAt: null,
    };
  }

  // 获取学生的搜索设置
  async getSearchSettings(studentId: string) {
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
      include: { role: true },
    });

    if (!student) {
      throw new NotFoundException('学生不存在');
    }

    if (student.role.name !== 'student') {
      throw new BadRequestException('该用户不是学生');
    }

    return {
      // isSearchable: student.isSearchable || false,
      // searchNickname: student.searchNickname,
      // schoolName: student.schoolName,
      // className: student.className,
      // anonymousId: student.anonymousId,
      isSearchable: false, // 临时返回默认值
      searchNickname: null,
      schoolName: null,
      className: null,
      anonymousId: null,
    };
  }

  // 获取搜索说明
  getSearchExplanation() {
    return {
      title: '开启搜索功能说明',
      content: [
        '开启后，家长和老师可以通过昵称和学校信息搜索到您',
        '搜索时只会显示您的昵称和学校信息，不会暴露真实姓名和联系方式',
        '您可以随时关闭搜索功能，关闭后其他人将无法搜索到您',
        '即使开启了搜索，其他人也需要您的同意才能关注您',
        '您可以随时撤销任何人的关注权限'
      ],
      risks: [
        '可能被不熟悉的人搜索到',
        '需要谨慎设置昵称和学校信息'
      ],
      benefits: [
        '方便家长和老师找到您',
        '提高建立关注关系的效率'
      ]
    };
  }

  private generateAnonymousId(): string {
    return 'stu_' + randomBytes(8).toString('hex');
  }

  private generateShareCodeString(): string {
    return randomBytes(6).toString('hex').toUpperCase();
  }
}
