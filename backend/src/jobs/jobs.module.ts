import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { Job } from './entities/job.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Job, AuthModule])],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}
