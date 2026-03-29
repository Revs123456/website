import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { Service } from './entities/service.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Service, AuthModule])],
  controllers: [ServicesController],
  providers: [ServicesService],
})
export class ServicesModule {}
