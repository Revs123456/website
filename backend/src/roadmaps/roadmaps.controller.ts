import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { RoadmapsService } from './roadmaps.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('roadmaps')
export class RoadmapsController {
  constructor(private readonly roadmapsService: RoadmapsService) {}

  @Get()
  findAll() { return this.roadmapsService.findAll(); }

  @Get('published')
  findPublished() { return this.roadmapsService.findPublished(); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.roadmapsService.findOne(id); }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() body: any) { return this.roadmapsService.create(body); }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) { return this.roadmapsService.update(id, body); }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) { return this.roadmapsService.remove(id); }
}
