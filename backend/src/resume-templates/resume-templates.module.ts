import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResumeTemplate } from './entities/resume-template.entity';
import { ResumeTemplatesService } from './resume-templates.service';
import { ResumeTemplatesController } from './resume-templates.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ResumeTemplate])],
  controllers: [ResumeTemplatesController],
  providers: [ResumeTemplatesService],
})
export class ResumeTemplatesModule {}
