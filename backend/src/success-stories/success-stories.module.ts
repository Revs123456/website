import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SuccessStoriesService } from './success-stories.service';
import { SuccessStoriesController } from './success-stories.controller';

@Module({
  imports: [AuthModule],
  controllers: [SuccessStoriesController],
  providers: [SuccessStoriesService],
})
export class SuccessStoriesModule {}
