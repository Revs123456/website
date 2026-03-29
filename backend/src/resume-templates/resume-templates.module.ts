import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResumeTemplate } from './entities/resume-template.entity';
import { ResumeTemplatesService } from './resume-templates.service';
import { ResumeTemplatesController } from './resume-templates.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ResumeTemplate, AuthModule])],
  controllers: [ResumeTemplatesController],
  providers: [ResumeTemplatesService],
})
export class ResumeTemplatesModule {}
