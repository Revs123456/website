import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SuccessStoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(page = 1, limit = 50) {
    const take = Math.min(limit, 200);
    const skip = (page - 1) * take;
    return this.prisma.successStory.findMany({ orderBy: { created_at: 'desc' }, skip, take });
  }

  findPublished() {
    return this.prisma.successStory.findMany({ where: { published: true }, orderBy: { created_at: 'desc' }, take: 100 });
  }

  async findOne(id: string) {
    const item = await this.prisma.successStory.findUnique({ where: { id } });
    if (!item) throw new NotFoundException();
    return item;
  }

  create(data: any) {
    return this.prisma.successStory.create({ data });
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.successStory.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.prisma.successStory.delete({ where: { id } });
    return { deleted: true };
  }
}
