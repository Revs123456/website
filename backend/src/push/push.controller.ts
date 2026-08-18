import { Body, Controller, Delete, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { IsObject, IsString, IsUrl } from 'class-validator';
import { Request } from 'express';
import { PushService } from './push.service';
import { UserJwtAuthGuard } from '../users/guards/user-jwt.guard';

class SubscribeDto {
  @IsUrl({ require_protocol: true })
  endpoint: string;

  @IsObject()
  keys: { p256dh: string; auth: string };
}

class UnsubscribeDto {
  @IsString()
  endpoint: string;
}

@Controller('push')
export class PushController {
  constructor(private readonly svc: PushService) {}

  /** Public — service worker fetches this on register to know what key to use. */
  @Get('vapid-public-key')
  publicKey() {
    return { key: this.svc.getPublicKey(), enabled: this.svc.isEnabled() };
  }

  /** Save a device's push subscription. Frontend calls this after permission granted. */
  @UseGuards(UserJwtAuthGuard)
  @Post('subscribe')
  @HttpCode(200)
  subscribe(@Body() dto: SubscribeDto, @Req() req: Request) {
    const ua = req.headers['user-agent']?.toString().slice(0, 300);
    return this.svc.subscribe((req as any).user.sub, dto, ua);
  }

  @UseGuards(UserJwtAuthGuard)
  @Delete('subscribe')
  unsubscribe(@Body() dto: UnsubscribeDto, @Req() req: Request) {
    return this.svc.unsubscribe((req as any).user.sub, dto.endpoint);
  }
}
