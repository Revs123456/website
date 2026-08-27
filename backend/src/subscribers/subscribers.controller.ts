import { UseGuards, Controller, Get, Post, Patch, Delete, Body, Param, Query, HttpCode } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { SubscribersService } from './subscribers.service';
import { CreateSubscriberDto } from './dto/create-subscriber.dto';

@Controller('subscribers')
export class SubscribersController {
  constructor(private readonly service: SubscribersService) {}

  // Public — newsletter sign-up: 3 per hour per IP
  @Throttle({ default: { ttl: 3600000, limit: 3 } })
  @Post()
  create(@Body() body: CreateSubscriberDto) { return this.service.create(body); }

  // Public, self-serve unsubscribe — linked from the welcome email. POST (not
  // GET) so email-security link-scanners that pre-fetch every URL in an inbox
  // can't silently unsubscribe someone before they ever open the email.
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('unsubscribe/:id')
  @HttpCode(200)
  unsubscribe(@Param('id') id: string) { return this.service.unsubscribe(id); }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) { return this.service.findAll(page ? +page : 1, limit ? +limit : undefined); }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() body: { active?: boolean }) {
    return this.service.update(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
