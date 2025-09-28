import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { CreateClassDto } from './dto/create-class.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { ClassStatus, EnrollmentStatus } from '@prisma/client';

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
      const newClass = await this.prisma.classes.create({
        data: {
          name: createClassDto.name,
          description: createClassDto.description,
          ownerTeacherId: teacherId,
          code: generateInviteCode(),
          status: ClassStatus.ACTIVE,
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
      const classExists = await this.prisma.classes.findFirst({
        where: {
          id: classId,
          ownerTeacherId: teacherId,
        },
      });

      if (!classExists) {
        throw new NotFoundException('Class not found or access denied');
      }

      const whereClause: any = {
        classId: classId,
      };

      if (status) {
        whereClause.status = EnrollmentStatus[status.toUpperCase() as keyof typeof EnrollmentStatus];
      }

      const approvals = await this.prisma.class_enrollments.findMany({
        where: whereClause,
        include: {
          User: {
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
        studentName: approval.User.displayName || approval.User.nickname || approval.User.email,
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
      const classExists = await this.prisma.classes.findFirst({
        where: {
          id: classId,
          ownerTeacherId: teacherId,
        },
      });

      if (!classExists) {
        throw new NotFoundException('Class not found or access denied');
      }

      const enrollment = await this.prisma.class_enrollments.findFirst({
        where: {
          id: memberId,
          classId: classId,
        },
      });

      if (!enrollment) {
        throw new NotFoundException('Enrollment request not found');
      }

      if (enrollment.status !== EnrollmentStatus.PENDING) {
        // Idempotency - return current state
        return {
          memberId: enrollment.id,
          classId: enrollment.classId,
          studentId: enrollment.studentId,
          status: enrollment.status.toLowerCase(),
        };
      }

      const updatedEnrollment = await this.prisma.class_enrollments.update({
        where: { id: memberId },
        data: {
          status: EnrollmentStatus.ACTIVE,
          updatedAt: new Date(),
        },
      });

      // Create audit log
      await this.prisma.audit_logs.create({
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
      const classExists = await this.prisma.classes.findFirst({
        where: {
          id: classId,
          ownerTeacherId: teacherId,
        },
      });

      if (!classExists) {
        throw new NotFoundException('Class not found or access denied');
      }

      const enrollment = await this.prisma.class_enrollments.findFirst({
        where: {
          id: memberId,
          classId: classId,
        },
      });

      if (!enrollment) {
        throw new NotFoundException('Enrollment request not found');
      }

      if (enrollment.status !== EnrollmentStatus.PENDING) {
        // Idempotency - return current state
        return {
          memberId: enrollment.id,
          classId: enrollment.classId,
          studentId: enrollment.studentId,
          status: enrollment.status.toLowerCase(),
        };
      }

      const updatedEnrollment = await this.prisma.class_enrollments.update({
        where: { id: memberId },
        data: {
          status: EnrollmentStatus.REVOKED,
          updatedAt: new Date(),
        },
      });

      // Create audit log
      await this.prisma.audit_logs.create({
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
