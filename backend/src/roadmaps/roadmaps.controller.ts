import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { RoadmapsService } from './roadmaps.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CreateRoadmapDto } from './dto/create-roadmap.dto';

@Controller('roadmaps')
export class RoadmapsController {
  constructor(private readonly roadmapsService: RoadmapsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query('page') page = '1', @Query('limit') limit = '50') {
    return this.roadmapsService.findAll(+page, +limit);
  }

  @Get('published')
  findPublished() { return this.roadmapsService.findPublished(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.roadmapsService.findOne(id); }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() body: CreateRoadmapDto) { return this.roadmapsService.create(body); }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) { return this.roadmapsService.update(id, body); }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) { return this.roadmapsService.remove(id); }
}
