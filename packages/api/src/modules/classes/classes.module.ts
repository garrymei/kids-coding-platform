import { Module, forwardRef } from '@nestjs/common';
import { ClassesController } from './classes.controller';
import { PrismaService } from '../../prisma/prisma.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule), AuditModule],
  controllers: [ClassesController],
  providers: [PrismaService],
})
export class ClassesModule {}
