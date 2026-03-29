import { UseGuards, Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { TestimonialsService } from './testimonials.service';

@Controller('testimonials')
export class TestimonialsController {
  constructor(private readonly service: TestimonialsService) {}

  @Get() findAll() { return this.service.findAll(); }
  @Get('published') findPublished() { return this.service.findPublished(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @UseGuards(JwtAuthGuard)
  @Post() create(@Body() body: any) { return this.service.create(body); }
  @UseGuards(JwtAuthGuard)
  @Patch(':id') update(@Param('id') id: string, @Body() body: any) { return this.service.update(id, body); }
  @UseGuards(JwtAuthGuard)
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
