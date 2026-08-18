import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  private cachedLimit: number | null = null;

  private async getDefaultLimit(): Promise<number> {
    if (this.cachedLimit) return this.cachedLimit;
    const s = await this.prisma.setting.findUnique({ where: { key: 'pagination_default_limit' } });
    this.cachedLimit = s ? parseInt(s.value, 10) || 20 : 20;
    return this.cachedLimit;
  }

  create(dto: CreateOrderDto) {
    return this.prisma.order.create({
      data: {
        name: dto.name,
        customer_name: dto.customer_name,
        email: dto.email,
        customer_email: dto.customer_email,
        service_type: dto.service_type,
        service_id: dto.service_id,
        experience_level: dto.experience_level,
        message: dto.message,
        resume_file: dto.resume_file,
      },
    });
  }

  async findAll(page = 1, limit?: number) {
    const take = Math.min(limit ?? await this.getDefaultLimit(), 200);
    const skip = (page - 1) * take;
    return this.prisma.order.findMany({ orderBy: { created_at: 'desc' }, skip, take });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async update(id: string, data: any) {
    await this.findOne(id);
    return this.prisma.order.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.order.delete({ where: { id } });
  }
}
