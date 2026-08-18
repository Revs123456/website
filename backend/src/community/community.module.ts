import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CommunityService } from './community.service';
import { CommunityController } from './community.controller';
import { UserCommunityService } from './user-community.service';
import { UserCommunityController } from './user-community.controller';

@Module({
  imports: [AuthModule],
  controllers: [CommunityController, UserCommunityController],
  providers: [CommunityService, UserCommunityService],
})
export class CommunityModule {}
