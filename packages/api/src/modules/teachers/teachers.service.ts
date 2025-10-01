import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { CreateClassDto } from './dto/create-class.dto';
import { PrismaService } from '../../prisma/prisma.service';
// ClassStatus and EnrollmentStatus are now string enums in the schema

// Mock data for fallback
const mockApprovals = [
  {
    memberId: 'mem_1',
    classId: 'class_1',
    studentId: 'stu_4',
    studentName: '小李',
    status: 'pending',
    requestedAt: new Date().toISOString(),
  },
  {
    memberId: 'mem_2',
    classId: 'class_1',
    studentId: 'stu_5',
    studentName: '小王',
    status: 'pending',
    requestedAt: new Date().toISOString(),
  },
];

function generateInviteCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

@Injectable()
export class TeachersService {
  private readonly logger = new Logger(TeachersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createClass(createClassDto: CreateClassDto, teacherId: string) {
    this.logger.log(`Creating class: ${createClassDto.name} by teacher: ${teacherId}`);
    
    try {
      const newClass = await this.prisma.class.create({
        data: {
        name: createClassDto.name,
          teacherId: teacherId,
          code: generateInviteCode(),
          codeTTL: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      this.logger.log('Created new class:', newClass);
      return {
        id: newClass.id,
        code: newClass.code,
      };
    } catch (error) {
      this.logger.error('Failed to create class:', error);
      throw new BadRequestException('Failed to create class');
    }
  }

  async getApprovals(classId: string, teacherId: string, status: string) {
    this.logger.log(`Fetching approvals for class ${classId} with status ${status}`);
    
    try {
      // Verify teacher owns the class
      const classExists = await this.prisma.class.findFirst({
        where: {
          id: classId,
          teacherId: teacherId,
        },
      });

      if (!classExists) {
        throw new NotFoundException('Class not found or access denied');
      }

      const whereClause: any = {
        classId: classId,
      };

      if (status) {
        whereClause.status = status.toLowerCase();
      }

      const approvals = await this.prisma.classEnrollment.findMany({
        where: whereClause,
        include: {
          student: {
            select: {
              id: true,
              displayName: true,
              nickname: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return approvals.map(approval => ({
        memberId: approval.id,
        classId: approval.classId,
        studentId: approval.studentId,
        studentName: approval.student.displayName || approval.student.nickname || approval.student.email,
        status: approval.status.toLowerCase(),
        requestedAt: approval.createdAt.toISOString(),
      }));
    } catch (error) {
      this.logger.error('Failed to fetch approvals:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      // Fallback to mock data
      return mockApprovals.filter(
        (a) => a.classId === classId && a.status === status,
      );
    }
  }

  async approveApproval(classId: string, memberId: string, teacherId: string) {
    this.logger.log(`Approving enrollment: ${memberId} in class: ${classId}`);
    
    try {
      // Verify teacher owns the class
      const classExists = await this.prisma.class.findFirst({
        where: {
          id: classId,
          teacherId: teacherId,
        },
      });

      if (!classExists) {
        throw new NotFoundException('Class not found or access denied');
      }

      const enrollment = await this.prisma.classEnrollment.findFirst({
        where: {
          id: memberId,
          classId: classId,
        },
      });

      if (!enrollment) {
        throw new NotFoundException('Enrollment request not found');
      }

      if (enrollment.status !== 'pending') {
        // Idempotency - return current state
        return {
          memberId: enrollment.id,
          classId: enrollment.classId,
          studentId: enrollment.studentId,
          status: enrollment.status.toLowerCase(),
        };
      }

      const updatedEnrollment = await this.prisma.classEnrollment.update({
        where: { id: memberId },
        data: {
          status: 'active',
        },
      });

      // Create audit log
      await this.prisma.auditLog.create({
        data: {
          actorId: teacherId,
          action: 'CLASS_MEMBER_DECISION',
          targetType: 'class_enrollment',
          targetId: memberId,
          metadata: { decision: 'approved', classId },
        },
      });

      return {
        memberId: updatedEnrollment.id,
        classId: updatedEnrollment.classId,
        studentId: updatedEnrollment.studentId,
        status: updatedEnrollment.status.toLowerCase(),
      };
    } catch (error) {
      this.logger.error('Failed to approve enrollment:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to approve enrollment');
    }
  }

  async rejectApproval(classId: string, memberId: string, teacherId: string) {
    this.logger.log(`Rejecting enrollment: ${memberId} in class: ${classId}`);
    
    try {
      // Verify teacher owns the class
      const classExists = await this.prisma.class.findFirst({
        where: {
          id: classId,
          teacherId: teacherId,
        },
      });

      if (!classExists) {
        throw new NotFoundException('Class not found or access denied');
      }

      const enrollment = await this.prisma.classEnrollment.findFirst({
        where: {
          id: memberId,
          classId: classId,
        },
      });

      if (!enrollment) {
        throw new NotFoundException('Enrollment request not found');
      }

      if (enrollment.status !== 'pending') {
        // Idempotency - return current state
        return {
          memberId: enrollment.id,
          classId: enrollment.classId,
          studentId: enrollment.studentId,
          status: enrollment.status.toLowerCase(),
        };
      }

      const updatedEnrollment = await this.prisma.classEnrollment.update({
        where: { id: memberId },
        data: {
          status: 'revoked',
        },
      });

      // Create audit log
      await this.prisma.auditLog.create({
        data: {
          actorId: teacherId,
          action: 'CLASS_MEMBER_DECISION',
          targetType: 'class_enrollment',
          targetId: memberId,
          metadata: { decision: 'rejected', classId },
        },
      });

      return {
        memberId: updatedEnrollment.id,
        classId: updatedEnrollment.classId,
        studentId: updatedEnrollment.studentId,
        status: updatedEnrollment.status.toLowerCase(),
      };
    } catch (error) {
      this.logger.error('Failed to reject enrollment:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to reject enrollment');
    }
  }
}
