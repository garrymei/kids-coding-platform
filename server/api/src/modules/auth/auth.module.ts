import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoggerService } from '../../common/services/logger.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, LoggerService],
  exports: [AuthService],
})
export class AuthModule {}
