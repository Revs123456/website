import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubscribersService {
  constructor(private readonly prisma: PrismaService) {}

  private cachedLimit: number | null = null;

  private async getDefaultLimit(): Promise<number> {
    if (this.cachedLimit) return this.cachedLimit;
    const s = await this.prisma.setting.findUnique({ where: { key: 'pagination_default_limit' } });
    this.cachedLimit = s ? parseInt(s.value, 10) || 20 : 20;
    return this.cachedLimit;
  }

  async findAll(page = 1, limit?: number) {
    const take = Math.min(limit ?? await this.getDefaultLimit(), 200);
    const skip = (page - 1) * take;
    return this.prisma.subscriber.findMany({ orderBy: { created_at: 'desc' }, skip, take });
  }

  async create(data: { email?: string; whatsapp?: string; type?: string }) {
    if (data.email) {
      const existing = await this.prisma.subscriber.findFirst({ where: { email: data.email } });
      // Return success silently — don't reveal whether email was already subscribed (prevents enumeration)
      if (existing) return { message: 'Subscribed successfully' };
    }
    return this.prisma.subscriber.create({ data });
  }

  async update(id: string, data: { active?: boolean }) {
    return this.prisma.subscriber.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.prisma.subscriber.delete({ where: { id } });
    return { deleted: true };
  }

  count() {
    return this.prisma.subscriber.count();
  }
}
