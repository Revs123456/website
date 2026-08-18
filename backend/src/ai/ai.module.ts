import { Global, Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { ClaudeProvider } from './claude.provider';
import { UsageLimitsService } from './usage-limits.service';
import { UsageLimitsController } from './usage-limits.controller';

/**
 * @Global so any feature module can inject AiService + UsageLimitsService
 * without re-importing. Same pattern as MailModule, PrismaModule, EngagementModule.
 */
@Global()
@Module({
  controllers: [UsageLimitsController],
  providers: [AiService, ClaudeProvider, UsageLimitsService],
  exports: [AiService, UsageLimitsService],
})
export class AiModule {}
