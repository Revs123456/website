import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InterviewQuestion } from './entities/interview-question.entity';
import { InterviewQuestionsService } from './interview-questions.service';
import { InterviewQuestionsController } from './interview-questions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([InterviewQuestion]), AuthModule],
  controllers: [InterviewQuestionsController],
  providers: [InterviewQuestionsService],
})
export class InterviewQuestionsModule {}
