import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';

@Injectable()
export class BlogsService {
  constructor(private readonly prisma: PrismaService) {}

  private cachedLimit: number | null = null;

  private async getDefaultLimit(): Promise<number> {
    if (this.cachedLimit) return this.cachedLimit;
    const s = await this.prisma.setting.findUnique({ where: { key: 'pagination_default_limit' } });
    this.cachedLimit = s ? parseInt(s.value, 10) || 20 : 20;
    return this.cachedLimit;
  }

  create(dto: CreateBlogDto) {
    return this.prisma.blog.create({ data: dto as any });
  }

  async findAll(page = 1, limit?: number) {
    const take = Math.min(limit ?? await this.getDefaultLimit(), 200);
    const skip = (page - 1) * take;
    return this.prisma.blog.findMany({ orderBy: { created_at: 'desc' }, skip, take });
  }

  async findPublished(page = 1, limit?: number) {
    const take = Math.min(limit ?? await this.getDefaultLimit(), 200);
    const skip = (page - 1) * take;
    return this.prisma.blog.findMany({ where: { published: true }, orderBy: { created_at: 'desc' }, skip, take });
  }

  async findOne(id: string) {
    const blog = await this.prisma.blog.findUnique({ where: { id } });
    if (!blog) throw new NotFoundException();
    return blog;
  }

  async update(id: string, dto: UpdateBlogDto) {
    await this.findOne(id);
    return this.prisma.blog.update({ where: { id }, data: dto as any });
  }

  async remove(id: string) {
    await this.prisma.blog.delete({ where: { id } });
  }
}
