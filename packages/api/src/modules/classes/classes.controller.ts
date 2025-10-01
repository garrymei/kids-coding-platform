import { Controller, Post, Body, UseGuards, Request, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
// EnrollmentStatus is now a string enum in the schema

@Controller('classes')
@UseGuards(JwtAuthGuard)
export class ClassesController {
  private readonly logger = new Logger(ClassesController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Post('join')
  async joinClass(@Body() body: { code: string }, @Request() req) {
    const studentId = req.user.id;
    const { code } = body;

    this.logger.log(`Student ${studentId} attempting to join class with code: ${code}`);

    try {
      // Find class by code
      const classToJoin = await this.prisma.class.findUnique({
        where: { code },
        include: { enrollments: true },
      });

      if (!classToJoin) {
        throw new BadRequestException('CLASS_CODE_NOT_FOUND');
      }

      if (classToJoin.status !== 'ACTIVE') {
        throw new BadRequestException('CLASS_INACTIVE');
      }

      // Check if student is already enrolled
      const existingEnrollment = await this.prisma.classEnrollment.findFirst({
        where: {
          classId: classToJoin.id,
          studentId: studentId,
        },
      });

      if (existingEnrollment) {
        return {
          success: true,
          message: 'Already enrolled',
          enrollment: {
            id: existingEnrollment.id,
            status: existingEnrollment.status.toLowerCase(),
          },
        };
      }

      // Create enrollment request
      const enrollment = await this.prisma.classEnrollment.create({
        data: {
          classId: classToJoin.id,
          studentId: studentId,
          status: 'pending',
        },
      });

      // Create audit log
      await this.prisma.auditLog.create({
        data: {
          actorId: studentId,
          action: 'CLASS_JOIN_REQUEST',
          targetType: 'class',
          targetId: classToJoin.id,
          metadata: { code, classId: classToJoin.id },
        },
      });

      this.logger.log(`Student ${studentId} successfully requested to join class ${classToJoin.id}`);

      return {
        success: true,
        message: 'Join request submitted',
        enrollment: {
          id: enrollment.id,
          status: enrollment.status.toLowerCase(),
        },
      };
    } catch (error) {
      this.logger.error('Failed to join class:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to join class');
    }
  }
}