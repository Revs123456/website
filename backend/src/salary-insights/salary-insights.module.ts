import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalaryInsight } from './entities/salary-insight.entity';
import { SalaryInsightsService } from './salary-insights.service';
import { SalaryInsightsController } from './salary-insights.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SalaryInsight])],
  controllers: [SalaryInsightsController],
  providers: [SalaryInsightsService],
})
export class SalaryInsightsModule {}
