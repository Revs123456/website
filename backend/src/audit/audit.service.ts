import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  log(entry: { admin_email: string; method: string; path: string }): void {
    this.prisma.auditLog.create({ data: entry }).catch(err => console.error('[AUDIT] Failed to write audit log:', err));
  }

  findAll(page = 1, limit = 100) {
    const take = Math.min(limit, 500);
    const skip = (page - 1) * take;
    return this.prisma.auditLog.findMany({ orderBy: { created_at: 'desc' }, skip, take });
  }
}
