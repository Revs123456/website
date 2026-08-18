import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DailyTipsService } from './daily-tips.service';
import { DailyTipsController } from './daily-tips.controller';

@Module({
  imports: [AuthModule],
  controllers: [DailyTipsController],
  providers: [DailyTipsService],
})
export class DailyTipsModule {}
