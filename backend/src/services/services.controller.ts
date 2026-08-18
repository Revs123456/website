import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Header } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @UseGuards(AdminGuard)
  @Post()
  create(@Body() createServiceDto: CreateServiceDto) {
    return this.servicesService.create(createServiceDto);
  }

  // Public route — only published services, cached 60 s
  @Get('published')
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  findPublished(@Query('page') page = '1', @Query('limit') limit = '50') {
    return this.servicesService.findPublished(+page, +limit);
  }

  // Public route — popular services only, cached 60 s
  @Get('popular')
  @Header('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  findPopular() {
    return this.servicesService.findPopular();
  }

  // Admin route — all services including unpublished
  @Get()
  findAll(@Query('page') page = '1', @Query('limit') limit = '50') {
    return this.servicesService.findAll(+page, +limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @UseGuards(AdminGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateServiceDto: UpdateServiceDto) {
    return this.servicesService.update(id, updateServiceDto);
  }

  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @UseGuards(AdminGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.servicesService.remove(id);
  }
}
