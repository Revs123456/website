import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuccessStory } from './entities/success-story.entity';
import { SuccessStoriesService } from './success-stories.service';
import { SuccessStoriesController } from './success-stories.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SuccessStory]), AuthModule],
  controllers: [SuccessStoriesController],
  providers: [SuccessStoriesService],
})
export class SuccessStoriesModule {}
