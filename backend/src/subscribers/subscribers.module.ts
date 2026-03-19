import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscriber } from './entities/subscriber.entity';
import { SubscribersService } from './subscribers.service';
import { SubscribersController } from './subscribers.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Subscriber])],
  controllers: [SubscribersController],
  providers: [SubscribersService],
})
export class SubscribersModule {}
