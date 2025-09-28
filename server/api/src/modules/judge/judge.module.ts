import { Module } from '@nestjs/common';
import { JudgeController } from './judge.controller';
import { LEDJudgeController } from './led.controller';
import { JudgeService } from './judge.service';
import { EventBridgeService } from '../execute/event-bridge.service';

@Module({
  controllers: [JudgeController, LEDJudgeController],
  providers: [JudgeService, EventBridgeService],
  exports: [JudgeService],
})
export class JudgeModule {}