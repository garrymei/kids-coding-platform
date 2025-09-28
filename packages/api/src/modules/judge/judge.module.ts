import { Module } from '@nestjs/common';
import { JudgeController } from './judge.controller';
import { JudgeService } from './judge.service';
import { LEDController } from './led.controller';

@Module({
  controllers: [JudgeController, LEDController],
  providers: [JudgeService],
  exports: [JudgeService],
})
export class JudgeModule {}
