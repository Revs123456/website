import { Global, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UserJwtAuthGuard } from './guards/user-jwt.guard';
import { OtpModule } from '../otp/otp.module';

/**
 * @Global so UserJwtAuthGuard and UsersService can be injected by any feature
 * module (challenges, engagement, viral, etc.) without each one re-importing
 * UsersModule. EngagementModule is also @Global — together they break what
 * would otherwise be a circular import (Users needs Xp/Badges; Engagement
 * needs UserJwtAuthGuard).
 */
@Global()
@Module({
  imports: [OtpModule],
  controllers: [UsersController],
  providers: [UsersService, UserJwtAuthGuard],
  exports: [UsersService, UserJwtAuthGuard],
})
export class UsersModule {}
