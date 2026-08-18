import { Global, Module } from '@nestjs/common';
import { XpService } from './xp.service';
import { StreakService } from './streak.service';
import { BadgesService } from './badges.service';
import { EngagementController } from './engagement.controller';

/**
 * @Global so xp/streak/badge services can be injected by any future module
 * (challenges, viral, AI, etc.) without rewiring imports each time.
 *
 * No explicit UsersModule import — UsersModule is @Global, so UserJwtAuthGuard
 * is already available to this module's controller. This breaks what would
 * otherwise be a Users↔Engagement circular dependency.
 */
@Global()
@Module({
  controllers: [EngagementController],
  providers: [XpService, StreakService, BadgesService],
  exports: [XpService, StreakService, BadgesService],
})
export class EngagementModule {}
