import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateServiceDto) {
    return this.prisma.service.create({
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        included_features: dto.included_features,
        image_url: dto.image_url,
        is_popular: dto.is_popular ?? false,
        published: dto.published ?? true,
        requires_slot: dto.requires_slot ?? false,
        requires_file_upload: dto.requires_file_upload ?? false,
        file_upload_label: dto.file_upload_label,
        custom_fields: (dto.custom_fields ?? []) as any,
      },
    });
  }

  async findAll(page = 1, limit = 50) {
    const take = Math.min(limit, 200);
    const skip = (page - 1) * take;
    const [data, total] = await Promise.all([
      this.prisma.service.findMany({
        skip,
        take,
        orderBy: [{ is_popular: 'desc' }, { created_at: 'desc' }],
      }),
      this.prisma.service.count(),
    ]);
    return { data, total, page, limit: take };
  }

  async findPublished(page = 1, limit = 50) {
    const take = Math.min(limit, 200);
    const skip = (page - 1) * take;
    const [data, total] = await Promise.all([
      this.prisma.service.findMany({
        where: { published: true },
        skip,
        take,
        orderBy: [{ is_popular: 'desc' }, { created_at: 'desc' }],
      }),
      this.prisma.service.count({ where: { published: true } }),
    ]);
    return { data, total, page, limit: take };
  }

  findPopular() {
    return this.prisma.service.findMany({
      where: { published: true, is_popular: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async update(id: string, dto: UpdateServiceDto) {
    await this.findOne(id);
    return this.prisma.service.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.included_features !== undefined && { included_features: dto.included_features }),
        ...(dto.image_url !== undefined && { image_url: dto.image_url }),
        ...(dto.is_popular !== undefined && { is_popular: dto.is_popular }),
        ...(dto.published !== undefined && { published: dto.published }),
        ...(dto.requires_slot !== undefined && { requires_slot: dto.requires_slot }),
        ...(dto.requires_file_upload !== undefined && { requires_file_upload: dto.requires_file_upload }),
        ...(dto.file_upload_label !== undefined && { file_upload_label: dto.file_upload_label }),
        ...(dto.custom_fields !== undefined && { custom_fields: dto.custom_fields as any }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.service.delete({ where: { id } });
  }
}
