import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JobApplicationsService } from './job-applications.service';
import { CreateApplicationDto, UpdateApplicationDto } from './dto/application.dto';
import { UserJwtAuthGuard } from '../users/guards/user-jwt.guard';

@UseGuards(UserJwtAuthGuard)
@Controller('applications')
export class JobApplicationsController {
  constructor(private readonly svc: JobApplicationsService) {}

  /** Kanban-shape response — { board: { saved, applied, interview, offer, rejected }, total } */
  @Get()
  list(@Req() req: Request) {
    return this.svc.listKanban((req as any).user.sub);
  }

  @Post()
  @HttpCode(200)
  create(@Body() dto: CreateApplicationDto, @Req() req: Request) {
    return this.svc.create((req as any).user.sub, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateApplicationDto, @Req() req: Request) {
    return this.svc.update((req as any).user.sub, id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: Request) {
    return this.svc.remove((req as any).user.sub, id);
  }
}
