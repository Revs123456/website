import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { Job } from '../jobs/entities/job.entity';
import { Course } from '../courses/entities/course.entity';
import { Blog } from '../blogs/entities/blog.entity';
import { Service } from '../services/entities/service.entity';
import { Setting } from '../settings/entities/setting.entity';
import { Admin } from '../auth/entities/admin.entity';
import { Testimonial } from '../testimonials/entities/testimonial.entity';
import { InterviewQuestion } from '../interview-questions/entities/interview-question.entity';
import { SalaryInsight } from '../salary-insights/entities/salary-insight.entity';
import { DailyTip } from '../daily-tips/entities/daily-tip.entity';
import { Roadmap } from '../roadmaps/entities/roadmap.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Job, Course, Blog, Service, Setting, Admin, Testimonial, InterviewQuestion, SalaryInsight, DailyTip, Roadmap])],
  providers: [SeedService],
})
export class SeedModule {}
