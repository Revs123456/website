import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { SubscribersService } from './subscribers.service';

@Controller('subscribers')
export class SubscribersController {
  constructor(private readonly service: SubscribersService) {}
  @Get() findAll() { return this.service.findAll(); }
  @Post() create(@Body() body: any) { return this.service.create(body); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
