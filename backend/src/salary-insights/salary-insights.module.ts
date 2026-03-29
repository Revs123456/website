import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalaryInsight } from './entities/salary-insight.entity';
import { SalaryInsightsService } from './salary-insights.service';
import { SalaryInsightsController } from './salary-insights.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SalaryInsight, AuthModule])],
  controllers: [SalaryInsightsController],
  providers: [SalaryInsightsService],
})
export class SalaryInsightsModule {}
