import { UseGuards, Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { DailyTipsService } from './daily-tips.service';

@Controller('daily-tips')
export class DailyTipsController {
  constructor(private readonly service: DailyTipsService) {}
  @Get() findAll() { return this.service.findAll(); }
  @Get('random') findRandom() { return this.service.findRandom(); }
  @UseGuards(JwtAuthGuard)
  @Post() create(@Body() body: any) { return this.service.create(body); }
  @UseGuards(JwtAuthGuard)
  @Patch(':id') update(@Param('id') id: string, @Body() body: any) { return this.service.update(id, body); }
  @UseGuards(JwtAuthGuard)
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
