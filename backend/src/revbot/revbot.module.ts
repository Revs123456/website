import { Module } from '@nestjs/common';
import { RevBotService } from './revbot.service';
import { RevBotController } from './revbot.controller';

@Module({
  controllers: [RevBotController],
  providers: [RevBotService],
})
export class RevBotModule {}
