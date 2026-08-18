import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SalaryInsightsService } from './salary-insights.service';
import { SalaryInsightsController } from './salary-insights.controller';

@Module({
  imports: [AuthModule],
  controllers: [SalaryInsightsController],
  providers: [SalaryInsightsService],
})
export class SalaryInsightsModule {}
