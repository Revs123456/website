import { Global, Module } from '@nestjs/common';
import { EvaluatorService } from './evaluator.service';
import { EvaluatorController } from './evaluator.controller';

/**
 * @Global so ChallengesService can inject EvaluatorService for the async
 * auto-eval hook on daily-challenge submission. (ChallengesModule otherwise
 * doesn't import EvaluatorModule directly.)
 */
@Global()
@Module({
  controllers: [EvaluatorController],
  providers: [EvaluatorService],
  exports: [EvaluatorService],
})
export class EvaluatorModule {}
