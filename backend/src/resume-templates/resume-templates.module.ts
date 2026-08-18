import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ResumeTemplatesService } from './resume-templates.service';
import { ResumeTemplatesController } from './resume-templates.controller';

@Module({
  imports: [AuthModule],
  controllers: [ResumeTemplatesController],
  providers: [ResumeTemplatesService],
})
export class ResumeTemplatesModule {}
