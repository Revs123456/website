import { Global, Module } from '@nestjs/common';
import { SavedJobsService } from './saved-jobs.service';
import { SavedJobsController } from './saved-jobs.controller';

/**
 * @Global so JobsController (different module) can inject SavedJobsService
 * to annotate the public /jobs list with `is_saved` per row for logged-in
 * users — the same pattern used for match_score in Phase 4.
 */
@Global()
@Module({
  controllers: [SavedJobsController],
  providers: [SavedJobsService],
  exports: [SavedJobsService],
})
export class SavedJobsModule {}
