import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UploadsModule } from '../uploads/uploads.module';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';

@Module({
  imports: [AuthModule, UploadsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
