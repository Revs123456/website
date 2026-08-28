import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsEventController } from './event.controller';
import { AnalyticsService } from './analytics.service';
import { Ga4Service } from './ga4.service';

@Module({
  controllers: [AnalyticsController, AnalyticsEventController],
  providers: [AnalyticsService, Ga4Service],
})
export class AnalyticsModule {}
