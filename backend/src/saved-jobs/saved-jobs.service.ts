import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SavedJobsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Save a job. Idempotent at the unique-constraint level — duplicate saves
   * return the existing row instead of erroring (better UX than a 409 spam).
   */
  async save(userId: string, jobId: string, notes?: string) {
    try {
      return await this.prisma.savedJob.create({
        data: { site_user_id: userId, job_id: jobId, notes },
      });
    } catch (e: any) {
      if (e?.code === 'P2002') {
        // Already saved — return the existing row idempotently
        const existing = await this.prisma.savedJob.findUnique({
          where: { site_user_id_job_id: { site_user_id: userId, job_id: jobId } },
        });
        if (existing) return existing;
      }
      // P2003 = FK violation (job doesn't exist)
      if (e?.code === 'P2003') throw new NotFoundException('Job not found');
      throw e;
    }
  }

  async unsave(userId: string, jobId: string) {
    const result = await this.prisma.savedJob.deleteMany({
      where: { site_user_id: userId, job_id: jobId },
    });
    return { removed: result.count };
  }

  /** List with full job details — used by /saved-jobs page. */
  async listMine(userId: string, limit = 100) {
    return this.prisma.savedJob.findMany({
      where: { site_user_id: userId },
      orderBy: { saved_at: 'desc' },
      take: Math.min(limit, 200),
      include: {
        job: true,
      },
    });
  }

  /**
   * Cheap "did I save this job?" check used by job cards. Returns a Set of
   * job IDs the user has saved. One DB hit instead of N.
   */
  async savedIdsForUser(userId: string, jobIds: string[]): Promise<Set<string>> {
    if (jobIds.length === 0) return new Set();
    const rows = await this.prisma.savedJob.findMany({
      where: { site_user_id: userId, job_id: { in: jobIds } },
      select: { job_id: true },
    });
    return new Set(rows.map(r => r.job_id));
  }
}
