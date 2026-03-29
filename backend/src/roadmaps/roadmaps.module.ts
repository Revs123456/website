import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoadmapsService } from './roadmaps.service';
import { RoadmapsController } from './roadmaps.controller';
import { Roadmap } from './entities/roadmap.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Roadmap])],
  controllers: [RoadmapsController],
  providers: [RoadmapsService],
})
export class RoadmapsModule {}
