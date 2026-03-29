import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscriber } from './entities/subscriber.entity';
import { SubscribersService } from './subscribers.service';
import { SubscribersController } from './subscribers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Subscriber, AuthModule])],
  controllers: [SubscribersController],
  providers: [SubscribersService],
})
export class SubscribersModule {}
