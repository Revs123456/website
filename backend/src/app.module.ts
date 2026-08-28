import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
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
import { SlotsModule } from './slots/slots.module';
import { MailModule } from './mail/mail.module';
import { AuditModule } from './audit/audit.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ChatModule } from './chat/chat.module';
import { OtpModule } from './otp/otp.module';
import { UsersModule } from './users/users.module';
import { EngagementModule } from './engagement/engagement.module';
import { ChallengesModule } from './challenges/challenges.module';
import { AiModule } from './ai/ai.module';
import { ViralModule } from './viral/viral.module';
import { OptimizerModule } from './optimizer/optimizer.module';
import { EvaluatorModule } from './evaluator/evaluator.module';
import { MockInterviewModule } from './mock-interview/mock-interview.module';
import { RevBotModule } from './revbot/revbot.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
// Phase 6
import { NotificationsModule } from './notifications/notifications.module';
import { ActivityFeedModule } from './activity-feed/activity-feed.module';
import { SavedJobsModule } from './saved-jobs/saved-jobs.module';
import { JobApplicationsModule } from './job-applications/job-applications.module';
import { DashboardModule } from './dashboard/dashboard.module';
// Phase 7 — production & scale
import { PushModule } from './push/push.module';
import { CacheModule } from './cache/cache.module';
import { HealthModule } from './health/health.module';
import { RequestLogInterceptor } from './common/interceptors/request-log.interceptor';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60000, limit: 30 }],
      // Use the real client IP from Render's load balancer, not the LB's own IP
      getTracker: (req: any) => {
        const forwarded = req.headers['x-forwarded-for'];
        const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0];
        return (ip?.trim() || req.ip || '0.0.0.0') as string;
      },
    }),
    PrismaModule,
    MailModule,
    AuditModule,
    AnalyticsModule,
    JobsModule, CoursesModule, OrdersModule, ServicesModule, AuthModule, BlogsModule, SeedModule, SettingsModule, TestimonialsModule,
    SubscribersModule, InterviewQuestionsModule, SalaryInsightsModule, DailyTipsModule, SuccessStoriesModule, CommunityModule, BookingsModule, ResumeTemplatesModule, RoadmapsModule, PaymentsModule, SlotsModule, ChatModule, OtpModule, UsersModule,
    EngagementModule, ChallengesModule, AiModule, ViralModule,
    OptimizerModule, EvaluatorModule, MockInterviewModule, RevBotModule, SubscriptionsModule,
    NotificationsModule, ActivityFeedModule, SavedJobsModule, JobApplicationsModule, DashboardModule,
    CacheModule, PushModule, HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Phase 7 — global structured request logger.
    // Mounted globally so every route gets consistent log format.
    { provide: APP_INTERCEPTOR, useClass: RequestLogInterceptor },
  ],
})
export class AppModule {}
