import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { JobMatchService } from './job-match.service';

@Module({
  imports: [AuthModule],
  controllers: [JobsController],
  providers: [JobsService, JobMatchService],
})
export class JobsModule {}
