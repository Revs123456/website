import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { WeeklyDigestService } from './weekly-digest.service';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, WeeklyDigestService],
})
export class DashboardModule {}
