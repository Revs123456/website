import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { SubscribersService } from './subscribers.service';
import { SubscribersController } from './subscribers.controller';

@Module({
  imports: [AuthModule, MailModule],
  controllers: [SubscribersController],
  providers: [SubscribersService],
})
export class SubscribersModule {}
