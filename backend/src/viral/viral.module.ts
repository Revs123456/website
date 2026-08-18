import { Global, Module } from '@nestjs/common';
import { RoastController } from './roast/roast.controller';
import { RoastService } from './roast/roast.service';
import { PublicProfileController } from './profiles/public-profile.controller';
import { PublicProfileService } from './profiles/public-profile.service';
import { QuizController } from './quiz/quiz.controller';
import { QuizService } from './quiz/quiz.service';
import { PlacementsController } from './placements/placements.controller';
import { PlacementsService } from './placements/placements.service';
import { ReferralsController } from './referrals/referrals.controller';
import { ReferralsService } from './referrals/referrals.service';

/**
 * @Global so ReferralsService can be injected into UsersService without a
 * Viral↔Users circular import. Same pattern as Engagement and Users modules.
 */
@Global()
@Module({
  controllers: [
    RoastController,
    PublicProfileController,
    QuizController,
    PlacementsController,
    ReferralsController,
  ],
  providers: [
    RoastService,
    PublicProfileService,
    QuizService,
    PlacementsService,
    ReferralsService,
  ],
  exports: [ReferralsService],
})
export class ViralModule {}
