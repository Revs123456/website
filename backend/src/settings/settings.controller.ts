import { UseGuards, Controller, Get, Post, Body, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  findAll() {
    return this.settingsService.findAll();
  }

  @Get('map')
  getMap() {
    return this.settingsService.getMap();
  }

  @Get(':key')
  findOne(@Param('key') key: string) {
    return this.settingsService.findOne(key);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  upsert(@Body() body: { key: string; value: string; label?: string; description?: string }) {
    return this.settingsService.upsert(body.key, body.value, body.label, body.description);
  }

  @UseGuards(JwtAuthGuard)
  @Post('bulk')
  updateMany(@Body() updates: { key: string; value: string }[]) {
    return this.settingsService.updateMany(updates);
  }
}
