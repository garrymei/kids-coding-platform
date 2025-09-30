import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { CreateLinkRequestDto } from './dto/link-request.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { Role, ConsentStatus } from '@prisma/client';

@Injectable()
export class ParentsService {
  private readonly logger = new Logger(ParentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async discoverStudents(query: string) {
    this.logger.log(`Searching for students with query: ${query}`);
    const students = await this.prisma.user.findMany({
      where: {
        role: Role.student,
        name: { contains: query, mode: 'insensitive' },
      },
      select: {
        id: true,
        name: true,
        avatar: true,
      },
      take: 20,
    });
    return students;
  }

  async createLinkRequest(createLinkRequestDto: CreateLinkRequestDto, parentId: string) {
    this.logger.log(`Creating link request for student: ${createLinkRequestDto.studentId} by parent: ${parentId}`);

    const student = await this.prisma.user.findFirst({
      where: { id: createLinkRequestDto.studentId, role: Role.student },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Prevent duplicate pending requests
    const existingRequest = await this.prisma.parentLinkRequest.findFirst({
      where: {
        parentId: parentId,
        studentId: createLinkRequestDto.studentId,
        status: ConsentStatus.pending,
      },
    });

    if (existingRequest) {
      return existingRequest;
    }

    const newRequest = await this.prisma.parentLinkRequest.create({
      data: {
        parentId: parentId,
        studentId: createLinkRequestDto.studentId,
        note: createLinkRequestDto.note,
        status: ConsentStatus.pending,
      },
    });

    return newRequest;
  }

  async getLinkRequests(parentId: string, status?: 'pending' | 'approved' | 'rejected') {
    this.logger.log(`Fetching link requests for parent: ${parentId} with status: ${status}`);

    const whereClause: any = {
      parentId: parentId,
    };

    if (status) {
      whereClause.status = status;
    }

    const requests = await this.prisma.parentLinkRequest.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Map to the structure expected by the frontend
    return requests.map(req => ({
      id: req.id,
      studentId: req.studentId,
      studentName: req.student.name,
      status: req.status,
      createdAt: req.createdAt.toISOString(),
      note: req.note,
    }));
  }
}
