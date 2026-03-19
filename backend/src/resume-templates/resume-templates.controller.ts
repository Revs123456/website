import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { ResumeTemplatesService } from './resume-templates.service';

@Controller('resume-templates')
export class ResumeTemplatesController {
  constructor(private readonly service: ResumeTemplatesService) {}
  @Get() findAll() { return this.service.findAll(); }
  @Get('published') findPublished() { return this.service.findPublished(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Post() create(@Body() body: any) { return this.service.create(body); }
  @Patch(':id') update(@Param('id') id: string, @Body() body: any) { return this.service.update(id, body); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
