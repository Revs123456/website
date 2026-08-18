import { UseGuards, Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { SalaryInsightsService } from './salary-insights.service';
import { CreateSalaryInsightDto } from './dto/create-salary-insight.dto';

@Controller('salary-insights')
export class SalaryInsightsController {
  constructor(private readonly service: SalaryInsightsService) {}
  @UseGuards(JwtAuthGuard)
  @Get() findAll(@Query('page') page = '1', @Query('limit') limit = '50') {
    return this.service.findAll(+page, +limit);
  }
  @Get(':id') findOne(@Param('id') id: string) { return this.service.findOne(id); }
  @UseGuards(JwtAuthGuard)
  @Post() create(@Body() body: CreateSalaryInsightDto) { return this.service.create(body); }
  @UseGuards(JwtAuthGuard)
  @Patch(':id') update(@Param('id') id: string, @Body() body: any) { return this.service.update(id, body); }
  @UseGuards(JwtAuthGuard)
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
