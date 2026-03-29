import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JobsModule } from './jobs/jobs.module';
import { CoursesModule } from './courses/courses.module';
import { OrdersModule } from './orders/orders.module';
import { ServicesModule } from './services/services.module';
import { AuthModule } from './auth/auth.module';
import { BlogsModule } from './blogs/blogs.module';
import { SeedModule } from './seed/seed.module';
import { SettingsModule } from './settings/settings.module';
import { TestimonialsModule } from './testimonials/testimonials.module';
import { SubscribersModule } from './subscribers/subscribers.module';
import { InterviewQuestionsModule } from './interview-questions/interview-questions.module';
import { SalaryInsightsModule } from './salary-insights/salary-insights.module';
import { DailyTipsModule } from './daily-tips/daily-tips.module';
import { SuccessStoriesModule } from './success-stories/success-stories.module';
import { CommunityModule } from './community/community.module';
import { BookingsModule } from './bookings/bookings.module';
import { ResumeTemplatesModule } from './resume-templates/resume-templates.module';
import { RoadmapsModule } from './roadmaps/roadmaps.module';
import { PaymentsModule } from './payments/payments.module';
import { Job } from './jobs/entities/job.entity';
import { Course } from './courses/entities/course.entity';
import { Order } from './orders/entities/order.entity';
import { Service } from './services/entities/service.entity';
import { Admin } from './auth/entities/admin.entity';
import { Blog } from './blogs/entities/blog.entity';
import { Setting } from './settings/entities/setting.entity';
import { Testimonial } from './testimonials/entities/testimonial.entity';
import { Subscriber } from './subscribers/entities/subscriber.entity';
import { InterviewQuestion } from './interview-questions/entities/interview-question.entity';
import { SalaryInsight } from './salary-insights/entities/salary-insight.entity';
import { DailyTip } from './daily-tips/entities/daily-tip.entity';
import { SuccessStory } from './success-stories/entities/success-story.entity';
import { CommunityQuestion } from './community/entities/community-question.entity';
import { Booking } from './bookings/entities/booking.entity';
import { ResumeTemplate } from './resume-templates/entities/resume-template.entity';
import { Roadmap } from './roadmaps/entities/roadmap.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'aws-1-ap-south-1.pooler.supabase.com',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER || 'postgres.ytmmuncusugyaniztlom',
      password: process.env.DB_PASS || 'CGYeGtQ53%wv$?2',
      database: process.env.DB_NAME || 'postgres',
      entities: [Job, Course, Order, Service, Admin, Blog, Setting, Testimonial, Subscriber, InterviewQuestion, SalaryInsight, DailyTip, SuccessStory, CommunityQuestion, Booking, ResumeTemplate, Roadmap],
      synchronize: true,
      ssl: { rejectUnauthorized: false },
    }),
    JobsModule, CoursesModule, OrdersModule, ServicesModule, AuthModule, BlogsModule, SeedModule, SettingsModule, TestimonialsModule,
    SubscribersModule, InterviewQuestionsModule, SalaryInsightsModule, DailyTipsModule, SuccessStoriesModule, CommunityModule, BookingsModule, ResumeTemplatesModule, RoadmapsModule, PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
