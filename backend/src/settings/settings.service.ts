import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.setting.findMany();
  }

  findOne(key: string) {
    return this.prisma.setting.findUnique({ where: { key } });
  }

  async upsert(key: string, value: string, label?: string, description?: string) {
    return this.prisma.setting.upsert({
      where: { key },
      update: { value, label, description },
      create: { key, value, label, description },
    });
  }

  async updateMany(updates: { key: string; value: string }[]) {
    if (!Array.isArray(updates) || updates.length > 100) {
      throw new BadRequestException('Provide between 1 and 100 updates');
    }
    await Promise.all(updates.map(({ key, value }) =>
      this.prisma.setting.update({ where: { key }, data: { value } }),
    ));
    return this.findAll();
  }

  async getMap(): Promise<Record<string, string>> {
    const all = await this.prisma.setting.findMany();
    return Object.fromEntries(all.map(s => [s.key, s.value]));
  }

  // Public-safe settings: excludes internal keys not meant for the frontend
  async getPublicMap(): Promise<Record<string, string>> {
    const all = await this.prisma.setting.findMany({
      where: { key: { not: { startsWith: 'jwt_' } } },
    });
    return Object.fromEntries(all.map(s => [s.key, s.value]));
  }
}
