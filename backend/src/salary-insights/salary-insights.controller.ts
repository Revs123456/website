import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { SalaryInsightsService } from './salary-insights.service';

@Controller('salary-insights')
export class SalaryInsightsController {
  constructor(private readonly service: SalaryInsightsService) {}
  @Get() findAll() { return this.service.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @Post() create(@Body() body: any) { return this.service.create(body); }
  @Patch(':id') update(@Param('id') id: string, @Body() body: any) { return this.service.update(id, body); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
