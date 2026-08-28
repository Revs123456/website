import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DailyTipsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(page = 1, limit = 50) {
    const take = Math.min(limit, 200);
    const skip = (page - 1) * take;
    return this.prisma.dailyTip.findMany({ orderBy: { created_at: 'desc' }, skip, take });
  }

  async findRandom() {
    // Use DB-side RANDOM() to avoid fetching all rows into memory
    const tips = await this.prisma.$queryRaw<{ id: string; tip: string; category: string; active: boolean; created_at: Date }[]>`
      SELECT * FROM daily_tips WHERE active = true ORDER BY RANDOM() LIMIT 1
    `;
    return tips[0] || null;
  }

  async findOne(id: string) {
    const item = await this.prisma.dailyTip.findUnique({ where: { id } });
    if (!item) throw new NotFoundException();
    return item;
  }

  create(data: any) {
    return this.prisma.dailyTip.create({ data });
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.dailyTip.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.dailyTip.delete({ where: { id } });
  }
}
