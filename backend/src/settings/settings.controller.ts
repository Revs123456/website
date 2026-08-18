import { UseGuards, Controller, Get, Post, Body, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // No auth — safe subset of settings for frontend use (excludes jwt_ keys)
  @Get('public')
  getPublic() {
    return this.settingsService.getPublicMap();
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.settingsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('map')
  getMap() {
    return this.settingsService.getMap();
  }

  @UseGuards(JwtAuthGuard)
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
