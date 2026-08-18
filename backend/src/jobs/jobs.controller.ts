import { UseGuards, Controller, Get, Post, Body, Patch, Param, Delete, Query, BadRequestException, Req } from '@nestjs/common';
import { IsString, IsInt, Min, Max, IsOptional } from 'class-validator';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { JobsService } from './jobs.service';
import { JobMatchService } from './job-match.service';
import { SavedJobsService } from '../saved-jobs/saved-jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';

class FetchExternalDto {
  @IsString() keywords: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsInt() @Min(1) @Max(5) pages?: number;
}

@Controller('jobs')
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly matchService: JobMatchService,
    private readonly savedJobsService: SavedJobsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createJobDto: CreateJobDto) {
    return this.jobsService.create(createJobDto);
  }

  // Admin only — returns all jobs including drafts
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.jobsService.findAll(page ? +page : 1, limit ? +limit : undefined);
  }

  // Public — published jobs only. When the user is signed in we attach a
  // deterministic match score (0-100) to each job. Zero AI cost; rule-based
  // overlap between profile and JD.
  @Get('published')
  async findPublished(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Req() req?: Request,
  ) {
    const jobs = await this.jobsService.findPublished(page ? +page : 1, limit ? +limit : undefined);

    const userId = this.optionalUserId(req);
    if (!userId) return jobs;

    // Compute match scores AND saved-job set in parallel — both are needed
    // for authenticated job cards.
    const [scoreMap, savedIds] = await Promise.all([
      this.matchService.scoreJobsForUser(userId, jobs.map(j => ({
        id: j.id, title: j.title, category: j.category,
        experience: j.experience, tech_stack: j.tech_stack,
        description: j.description,
      }))),
      this.savedJobsService.savedIdsForUser(userId, jobs.map(j => j.id)),
    ]);

    return jobs.map(j => ({
      ...j,
      match_score: scoreMap.size === 0 ? null : (scoreMap.get(j.id) ?? null),
      is_saved: savedIds.has(j.id),
    }));
  }

  /** Decode user cookie WITHOUT enforcing auth — match scores are opt-in. */
  private optionalUserId(req?: Request): string | null {
    try {
      const cookieToken = (req as any)?.cookies?.tch_user_token;
      if (!cookieToken) return null;
      const payload: any = jwt.verify(cookieToken, process.env.JWT_SECRET || '');
      return payload?.role === 'user' ? payload.sub : null;
    } catch {
      return null;
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateJobDto: UpdateJobDto) {
    return this.jobsService.update(id, updateJobDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.jobsService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('fetch-external')
  fetchExternal(@Body() body: FetchExternalDto) {
    return this.jobsService.fetchFromAdzuna({
      keywords: body.keywords,
      location: body.location ?? 'India',
      pages:    body.pages    ?? 1,
    });
  }
}
