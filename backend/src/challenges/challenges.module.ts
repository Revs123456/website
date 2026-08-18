import { Module } from '@nestjs/common';
import { ChallengesService } from './challenges.service';
import { ChallengesController } from './challenges.controller';

// UsersModule and EngagementModule are both @Global — no imports needed.
@Module({
  controllers: [ChallengesController],
  providers: [ChallengesService],
})
export class ChallengesModule {}
