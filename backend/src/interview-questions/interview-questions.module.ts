import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InterviewQuestionsService } from './interview-questions.service';
import { InterviewQuestionsController } from './interview-questions.controller';

@Module({
  imports: [AuthModule],
  controllers: [InterviewQuestionsController],
  providers: [InterviewQuestionsService],
})
export class InterviewQuestionsModule {}
