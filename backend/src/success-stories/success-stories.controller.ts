import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { SuccessStoriesService } from './success-stories.service';

@Controller('success-stories')
export class SuccessStoriesController {
  constructor(private readonly service: SuccessStoriesService) {}
  @Get() findAll() { return this.service.findAll(); }
  @Get('published') findPublished() { return this.service.findPublished(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Post() create(@Body() body: any) { return this.service.create(body); }
  @Patch(':id') update(@Param('id') id: string, @Body() body: any) { return this.service.update(id, body); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
