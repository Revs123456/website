import { Body, Controller, Delete, Get, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Request } from 'express';
import { SavedJobsService } from './saved-jobs.service';
import { UserJwtAuthGuard } from '../users/guards/user-jwt.guard';

class SaveJobDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

@UseGuards(UserJwtAuthGuard)
@Controller('saved-jobs')
export class SavedJobsController {
  constructor(private readonly svc: SavedJobsService) {}

  @Get()
  list(@Req() req: Request) {
    return this.svc.listMine((req as any).user.sub);
  }

  @Post(':jobId')
  @HttpCode(200)
  save(@Param('jobId') jobId: string, @Body() dto: SaveJobDto, @Req() req: Request) {
    return this.svc.save((req as any).user.sub, jobId, dto.notes);
  }

  @Delete(':jobId')
  unsave(@Param('jobId') jobId: string, @Req() req: Request) {
    return this.svc.unsave((req as any).user.sub, jobId);
  }
}
