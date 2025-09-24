import { Module } from '@nestjs/common';
import { SearchController } from './controllers/search.controller';
import { SearchStrategyService } from './services/search-strategy.service';
import { RateLimitService } from './services/rate-limit.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SearchController],
  providers: [SearchStrategyService, RateLimitService],
  exports: [SearchStrategyService, RateLimitService],
})
export class SearchModule {}
