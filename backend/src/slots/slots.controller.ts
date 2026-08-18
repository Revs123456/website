import { Controller, Get, Post, Delete, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SlotsService } from './slots.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { BookSlotDto } from './dto/book-slot.dto';
import { CreateSlotDto } from './dto/create-slot.dto';
import { UpdateSlotDto } from './dto/update-slot.dto';

@Controller('slots')
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  // Public — user sees available slots
  @Get('available')
  findAvailable() { return this.slotsService.findAvailable(); }

  // Public — book a slot after payment: 5 per hour per IP
  @Throttle({ default: { ttl: 3600000, limit: 5 } })
  @Post(':id/book')
  book(@Param('id') id: string, @Body() body: BookSlotDto) {
    return this.slotsService.book(id, body);
  }

  // Admin only — release a slot manually
  @UseGuards(JwtAuthGuard)
  @Post(':id/unbook')
  unbook(@Param('id') id: string) { return this.slotsService.unbook(id); }

  // Admin only
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() { return this.slotsService.findAll(); }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() body: CreateSlotDto) { return this.slotsService.create(body); }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateSlotDto) { return this.slotsService.update(id, body); }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/toggle')
  toggle(@Param('id') id: string) { return this.slotsService.toggleActive(id); }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) { return this.slotsService.remove(id); }
}
