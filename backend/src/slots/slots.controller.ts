import { Controller, Get, Post, Delete, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { SlotsService } from './slots.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('slots')
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  // Public — user sees available slots
  @Get('available')
  findAvailable() { return this.slotsService.findAvailable(); }

  // Public — book a slot after payment
  @Post(':id/book')
  book(@Param('id') id: string, @Body() body: { name: string; email: string; order_id?: string }) {
    return this.slotsService.book(id, body);
  }

  // Public — release slot if payment fails
  @Post(':id/unbook')
  unbook(@Param('id') id: string) { return this.slotsService.unbook(id); }

  // Admin only
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() { return this.slotsService.findAll(); }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() body: any) { return this.slotsService.create(body); }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) { return this.slotsService.update(id, body); }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/toggle')
  toggle(@Param('id') id: string) { return this.slotsService.toggleActive(id); }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) { return this.slotsService.remove(id); }
}
