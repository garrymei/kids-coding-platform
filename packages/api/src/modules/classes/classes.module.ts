import { Module } from '@nestjs/common';
import { ClassesController } from './classes.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [ClassesController],
  providers: [PrismaService],
})
export class ClassesModule {}