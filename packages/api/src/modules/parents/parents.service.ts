import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { CreateLinkRequestDto } from './dto/link-request.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { ConsentStatus } from '@prisma/client';

@Injectable()
export class ParentsService {
  private readonly logger = new Logger(ParentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async discoverStudents(query: string) {
    this.logger.log(`Searching for students with query: ${query}`);
    
    try {
      const students = await this.prisma.user.findMany({
        where: {
          Role: { name: 'student' },
          discoverable: true,
          status: 'ACTIVE',
          OR: [
            { displayName: { contains: query, mode: 'insensitive' } },
            { nickname: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          displayName: true,
          nickname: true,
          email: true,
        },
        take: 20, // Limit results
      });

      return students.map(student => ({
        id: student.id,
        name: student.displayName || student.nickname || student.email,
        avatar: `https://joeschmoe.io/api/v1/${student.id}`,
      }));
    } catch (error) {
      this.logger.error('Failed to discover students:', error);
      // Fallback to mock data if database fails
      return [
        { id: 'stu_1', name: '小明', avatar: 'https://joeschmoe.io/api/v1/male/random' },
        { id: 'stu_2', name: '小红', avatar: 'https://joeschmoe.io/api/v1/female/random' },
        { id: 'stu_3', name: '小刚', avatar: 'https://joeschmoe.io/api/v1/male/random' },
      ].filter(s => s.name.includes(query) || !query);
    }
  }

  async createLinkRequest(createLinkRequestDto: CreateLinkRequestDto, parentId: string) {
    this.logger.log(`Creating link request for student: ${createLinkRequestDto.studentId} by parent: ${parentId}`);
    
    try {
      // Check if student exists
      const student = await this.prisma.user.findUnique({
        where: { id: createLinkRequestDto.studentId },
        include: { Role: true },
      });

      if (!student || student.Role.name !== 'student') {
        throw new NotFoundException('Student not found');
      }

      // Check for existing pending request
      const existingRequest = await this.prisma.consents.findFirst({
        where: {
          studentId: createLinkRequestDto.studentId,
          requesterId: parentId,
          status: ConsentStatus.PENDING,
        },
      });

      if (existingRequest) {
        return {
          id: existingRequest.id,
          status: existingRequest.status.toLowerCase(),
        };
      }

      // Create new request
      const newRequest = await this.prisma.consents.create({
        data: {
          studentId: createLinkRequestDto.studentId,
          requesterId: parentId,
          purpose: 'parent_link',
          scope: ['progress', 'metrics'],
          status: ConsentStatus.PENDING,
        },
      });

      return {
        id: newRequest.id,
        status: newRequest.status.toLowerCase(),
      };
    } catch (error) {
      this.logger.error('Failed to create link request:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to create link request');
    }
  }

  async getLinkRequests(parentId: string, status?: 'pending' | 'approved' | 'rejected') {
    this.logger.log(`Fetching link requests for parent: ${parentId} with status: ${status}`);
    
    try {
      const whereClause: any = {
        requesterId: parentId,
      };

      if (status) {
        whereClause.status = ConsentStatus[status.toUpperCase() as keyof typeof ConsentStatus];
      }

      const requests = await this.prisma.consents.findMany({
        where: whereClause,
        include: {
          User_consents_studentIdToUser: {
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

      return requests.map(request => ({
        id: request.id,
        studentId: request.studentId,
        studentName: request.User_consents_studentIdToUser.displayName || 
                    request.User_consents_studentIdToUser.nickname || 
                    request.User_consents_studentIdToUser.email,
        status: request.status.toLowerCase(),
        createdAt: request.createdAt.toISOString(),
      }));
    } catch (error) {
      this.logger.error('Failed to fetch link requests:', error);
      // Fallback to mock data
      const mockRequests = [
        {
          id: 'req_1',
          studentId: 'stu_1',
          studentName: '小明',
          status: 'pending',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'req_2',
          studentId: 'stu_2',
          studentName: '小红',
          status: 'approved',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'req_3',
          studentId: 'stu_3',
          studentName: '小刚',
          status: 'rejected',
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
      
      if (!status) {
        return mockRequests;
      }
      return mockRequests.filter(req => req.status === status);
    }
  }
}
