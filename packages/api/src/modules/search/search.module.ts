import { Module, forwardRef } from '@nestjs/common';
import { SearchController } from './controllers/search.controller';
import { SearchStrategyService } from './services/search-strategy.service';
import { RateLimitService } from './services/rate-limit.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule), AuditModule],
  controllers: [SearchController],
  providers: [SearchStrategyService, RateLimitService],
  exports: [SearchStrategyService, RateLimitService],
})
export class SearchModule {}
