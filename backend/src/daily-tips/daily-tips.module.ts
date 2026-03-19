import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyTip } from './entities/daily-tip.entity';
import { DailyTipsService } from './daily-tips.service';
import { DailyTipsController } from './daily-tips.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DailyTip])],
  controllers: [DailyTipsController],
  providers: [DailyTipsService],
})
export class DailyTipsModule {}
