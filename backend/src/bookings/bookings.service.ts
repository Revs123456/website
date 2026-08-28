import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(page = 1, limit = 50) {
    const take = Math.min(limit, 200);
    const skip = (page - 1) * take;
    return this.prisma.booking.findMany({ orderBy: { created_at: 'desc' }, skip, take });
  }

  async findOne(id: string) {
    const item = await this.prisma.booking.findUnique({ where: { id } });
    if (!item) throw new NotFoundException();
    return item;
  }

  create(data: any) {
    return this.prisma.booking.create({ data });
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.booking.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.booking.delete({ where: { id } });
  }
}
