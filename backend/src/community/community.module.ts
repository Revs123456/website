import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommunityQuestion } from './entities/community-question.entity';
import { CommunityService } from './community.service';
import { CommunityController } from './community.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CommunityQuestion])],
  controllers: [CommunityController],
  providers: [CommunityService],
})
export class CommunityModule {}
