import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';

/* Keywords rotated daily so we cover the full tech spectrum */
const DAILY_SEARCHES = [
  { keywords: 'software developer',   location: 'India', pages: 2 },
  { keywords: 'frontend developer',   location: 'India', pages: 2 },
  { keywords: 'backend developer',    location: 'India', pages: 2 },
  { keywords: 'full stack developer', location: 'India', pages: 2 },
  { keywords: 'data scientist',       location: 'India', pages: 1 },
  { keywords: 'devops engineer',      location: 'India', pages: 1 },
  { keywords: 'react developer',      location: 'India', pages: 1 },
  { keywords: 'nodejs developer',     location: 'India', pages: 1 },
];

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private cachedLimit: number | null = null;

  private async getDefaultLimit(): Promise<number> {
    if (this.cachedLimit) return this.cachedLimit;
    const s = await this.prisma.setting.findUnique({ where: { key: 'pagination_default_limit' } });
    this.cachedLimit = s ? parseInt(s.value, 10) || 20 : 20;
    return this.cachedLimit;
  }

  create(dto: CreateJobDto) {
    return this.prisma.job.create({ data: dto as any });
  }

  async findAll(page = 1, limit?: number) {
    const take = Math.min(limit ?? await this.getDefaultLimit(), 200);
    const skip = (page - 1) * take;
    return this.prisma.job.findMany({ orderBy: { created_at: 'desc' }, skip, take });
  }

  async findPublished(page = 1, limit?: number) {
    const take = Math.min(limit ?? await this.getDefaultLimit(), 200);
    const skip = (page - 1) * take;
    return this.prisma.job.findMany({ where: { published: true }, orderBy: { created_at: 'desc' }, skip, take });
  }

  async findOne(id: string) {
    const job = await this.prisma.job.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  async update(id: string, dto: UpdateJobDto) {
    await this.findOne(id);
    return this.prisma.job.update({ where: { id }, data: dto as any });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.job.delete({ where: { id } });
  }

  /* ── Runs every day at 6:00 AM IST (00:30 UTC) ── */
  @Cron('30 0 * * *')
  async autoFetchJobs() {
    this.logger.log('⏰ Auto-fetch started');
    let totalImported = 0;
    let totalSkipped  = 0;
    for (const search of DAILY_SEARCHES) {
      try {
        const { imported, skipped } = await this.fetchFromAdzuna(search);
        totalImported += imported;
        totalSkipped  += skipped;
      } catch (err) {
        this.logger.warn(`Fetch failed for "${search.keywords}": ${(err as Error).message}`);
      }
    }
    this.logger.log(`✅ Auto-fetch done — imported: ${totalImported}, skipped: ${totalSkipped}`);
  }

  /* ── Runs every day at 1:00 AM IST (19:30 UTC previous day) ── */
  @Cron('30 19 * * *')
  async removeExpiredJobs() {
    const result = await this.prisma.job.deleteMany({
      where: { expires_at: { lt: new Date() } },
    });
    if (result.count > 0) {
      this.logger.log(`🗑️  Removed ${result.count} expired job(s)`);
    }
  }

  async fetchFromAdzuna(opts: {
    keywords: string;
    location: string;
    pages: number;
  }): Promise<{ imported: number; skipped: number }> {
    const appId  = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;
    if (!appId || !appKey) {
      throw new BadRequestException('ADZUNA_APP_ID and ADZUNA_APP_KEY env vars are not set');
    }

    let imported = 0;
    let skipped  = 0;

    for (let page = 1; page <= Math.min(opts.pages, 5); page++) {
      const url =
        `https://api.adzuna.com/v1/api/jobs/in/search/${page}` +
        `?app_id=${appId}&app_key=${appKey}` +
        `&what=${encodeURIComponent(opts.keywords)}` +
        `&where=${encodeURIComponent(opts.location)}` +
        `&results_per_page=20` +
        `&content-type=application/json`;

      const res  = await fetch(url);
      const data = await res.json() as any;
      if (!data.results?.length) break;

      for (const job of data.results) {
        // Skip duplicates by apply_link
        if (job.redirect_url) {
          const exists = await this.prisma.job.findFirst({ where: { apply_link: job.redirect_url } });
          if (exists) { skipped++; continue; }
        }

        const salaryStr = this.formatSalary(job.salary_min, job.salary_max);

        await this.prisma.job.create({
          data: {
            title:       (job.title ?? 'Untitled').slice(0, 200),
            company:     (job.company?.display_name ?? 'Unknown').slice(0, 200),
            location:    (job.location?.display_name ?? opts.location).slice(0, 200),
            experience:  '0–5 years',
            type:        job.contract_time === 'part_time' ? 'Part-time' : 'Full-time',
            category:    this.mapCategory(job.category?.label ?? ''),
            salary:      salaryStr,
            description: (job.description ?? '').slice(0, 20000),
            apply_link:  job.redirect_url ?? null,
            published:   false,   // admin reviews before publishing
          } as any,
        });
        imported++;
      }
    }

    return { imported, skipped };
  }

  private formatSalary(min?: number, max?: number): string | null {
    if (!min && !max) return null;
    const fmt = (n: number) => `₹${(n / 100000).toFixed(0)}L`;
    if (min && max) return `${fmt(min)} – ${fmt(max)}`;
    if (min) return `${fmt(min)}+`;
    return null;
  }

  private mapCategory(label: string): string {
    const l = label.toLowerCase();
    if (l.includes('front') || l.includes('react') || l.includes('angular') || l.includes('ui')) return 'Frontend';
    if (l.includes('devops') || l.includes('cloud') || l.includes('aws') || l.includes('infra')) return 'DevOps';
    if (l.includes('data') || l.includes('ml') || l.includes('ai') || l.includes('machine')) return 'AI/ML';
    if (l.includes('full')) return 'Full-Stack';
    return 'Backend';
  }
}
