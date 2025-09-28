import { Module } from '@nestjs/common';
import { ExecuteController } from './execute.controller';
import { ExecuteService } from './execute.service';
import { EventBridgeService } from './event-bridge.service';
import { JudgeModule } from '../judge/judge.module';

@Module({
  imports: [JudgeModule],
  controllers: [ExecuteController],
  providers: [ExecuteService, EventBridgeService],
  exports: [ExecuteService, EventBridgeService],
})
export class ExecuteModule {}
