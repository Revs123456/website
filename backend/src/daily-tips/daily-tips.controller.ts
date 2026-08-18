import { UseGuards, Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { DailyTipsService } from './daily-tips.service';
import { CreateDailyTipDto } from './dto/create-daily-tip.dto';

@Controller('daily-tips')
export class DailyTipsController {
  constructor(private readonly service: DailyTipsService) {}
  @UseGuards(JwtAuthGuard)
  @Get() findAll(@Query('page') page = '1', @Query('limit') limit = '50') {
    return this.service.findAll(+page, +limit);
  }
  @Get('random') findRandom() { return this.service.findRandom(); }
  @UseGuards(JwtAuthGuard)
  @Post() create(@Body() body: CreateDailyTipDto) { return this.service.create(body); }
  @UseGuards(JwtAuthGuard)
  @Patch(':id') update(@Param('id') id: string, @Body() body: any) { return this.service.update(id, body); }
  @UseGuards(JwtAuthGuard)
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
