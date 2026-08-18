import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { CreateApplicationDto, UpdateApplicationDto } from './dto/application.dto';

const STATUSES = ['saved', 'applied', 'interview', 'offer', 'rejected'] as const;
type Status = (typeof STATUSES)[number];

@Injectable()
export class JobApplicationsService {
  private readonly logger = new Logger(JobApplicationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateApplicationDto) {
    // If job_id is supplied, snapshot company/role from the live Job row so
    // the card stays meaningful even if the Job gets deleted later.
    let company = dto.company;
    let role = dto.role;
    let jobLink = dto.job_link;

    if (dto.job_id) {
      const job = await this.prisma.job.findUnique({ where: { id: dto.job_id } });
      if (job) {
        company = job.company;
        role = job.title;
        jobLink = jobLink || job.apply_link || undefined;
      }
    }

    return this.prisma.jobApplication.create({
      data: {
        site_user_id: userId,
        job_id: dto.job_id,
        company,
        role,
        job_link: jobLink,
        status: dto.status ?? 'saved',
        notes: dto.notes,
        applied_at: dto.applied_at ? new Date(dto.applied_at) : null,
        next_follow_up: dto.next_follow_up ? new Date(dto.next_follow_up) : null,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateApplicationDto) {
    const existing = await this.prisma.jobApplication.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Application not found');
    if (existing.site_user_id !== userId) throw new ForbiddenException();

    // Auto-set applied_at when status first transitions to "applied"
    const autoFields: any = {};
    if (dto.status === 'applied' && !existing.applied_at && !dto.applied_at) {
      autoFields.applied_at = new Date();
    }

    return this.prisma.jobApplication.update({
      where: { id },
      data: {
        status: dto.status,
        notes: dto.notes,
        applied_at: dto.applied_at !== undefined ? (dto.applied_at ? new Date(dto.applied_at) : null) : undefined,
        next_follow_up: dto.next_follow_up !== undefined ? (dto.next_follow_up ? new Date(dto.next_follow_up) : null) : undefined,
        offered_salary: dto.offered_salary,
        ...autoFields,
      },
    });
  }

  async remove(userId: string, id: string) {
    const existing = await this.prisma.jobApplication.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Application not found');
    if (existing.site_user_id !== userId) throw new ForbiddenException();
    return this.prisma.jobApplication.delete({ where: { id } });
  }

  /**
   * List grouped by status — perfect shape for a Kanban board.
   * One query, then bucket in memory. With <500 applications per user
   * this is faster than 5 separate queries.
   */
  async listKanban(userId: string) {
    const rows = await this.prisma.jobApplication.findMany({
      where: { site_user_id: userId },
      orderBy: { updated_at: 'desc' },
    });
    const board: Record<Status, typeof rows> = {
      saved: [], applied: [], interview: [], offer: [], rejected: [],
    };
    for (const r of rows) {
      const s = (STATUSES as readonly string[]).includes(r.status) ? (r.status as Status) : 'saved';
      board[s].push(r);
    }
    return { board, total: rows.length };
  }

  // ── Cron: send follow-up reminders ────────────────────────────────────────
  // Daily 9 AM IST. Finds applications whose next_follow_up date is today
  // and creates an in-app notification.
  @Cron('0 9 * * *', { timeZone: 'Asia/Kolkata' })
  async sendFollowUpReminders() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const due = await this.prisma.jobApplication.findMany({
      where: {
        next_follow_up: { gte: startOfDay, lt: endOfDay },
        status: { in: ['applied', 'interview'] },
      },
      select: { site_user_id: true, company: true, role: true, id: true },
    });

    if (due.length === 0) {
      this.logger.log('No follow-up reminders due today');
      return;
    }

    for (const app of due) {
      await this.notifications.create({
        userId: app.site_user_id,
        type: 'follow_up_due',
        title: `Time to follow up with ${app.company}`,
        body: `Your application for ${app.role} is due for a follow-up today.`,
        linkUrl: '/applications',
        icon: 'Calendar',
      });
    }
    this.logger.log(`Sent ${due.length} follow-up reminders`);
  }
}
