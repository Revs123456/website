import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoadmapsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(page = 1, limit = 50) {
    const take = Math.min(limit, 200);
    const skip = (page - 1) * take;
    return this.prisma.roadmap.findMany({ orderBy: { created_at: 'desc' }, skip, take });
  }

  findPublished() {
    return this.prisma.roadmap.findMany({ where: { published: true }, orderBy: { created_at: 'desc' }, take: 100 });
  }

  async findOne(id: string) {
    const item = await this.prisma.roadmap.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Roadmap not found');
    return item;
  }

  create(data: any) {
    return this.prisma.roadmap.create({ data });
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.roadmap.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.roadmap.delete({ where: { id } });
  }
}
