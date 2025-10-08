import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOneByEmail(email: string): Promise<User | undefined> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    const saltRounds = 10;
    if (data.passwordHash) {
        const hashedPassword = await bcrypt.hash(data.passwordHash, saltRounds);
        data.passwordHash = hashedPassword;
    }
    return this.prisma.user.create({ data });
  }
}