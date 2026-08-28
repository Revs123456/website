import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CustomFieldDefDto } from '../services/dto/custom-field-def.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploads: UploadsService,
  ) {}

  /**
   * Server-side validation of a customer's custom-field answers against the
   * service's own configured schema — never trusts arbitrary JSON from the
   * client. Throws BadRequestException with a specific, actionable message
   * on the first violation found.
   */
  private validateCustomFieldValues(fields: CustomFieldDefDto[], values: Record<string, unknown>): Record<string, unknown> {
    const validated: Record<string, unknown> = {};
    for (const field of fields) {
      const raw = values?.[field.key];
      const isEmpty = raw === undefined || raw === null || raw === '';

      if (field.required && isEmpty) {
        throw new BadRequestException(`"${field.label}" is required.`);
      }
      if (isEmpty) continue; // optional and not provided — skip

      switch (field.type) {
        case 'text':
        case 'textarea':
          if (typeof raw !== 'string') throw new BadRequestException(`"${field.label}" must be text.`);
          validated[field.key] = raw.slice(0, field.type === 'textarea' ? 5000 : 500);
          break;
        case 'number': {
          const n = typeof raw === 'number' ? raw : Number(raw);
          if (Number.isNaN(n)) throw new BadRequestException(`"${field.label}" must be a number.`);
          validated[field.key] = n;
          break;
        }
        case 'checkbox':
          validated[field.key] = raw === true || raw === 'true';
          break;
        case 'date':
          if (typeof raw !== 'string' || Number.isNaN(Date.parse(raw))) {
            throw new BadRequestException(`"${field.label}" must be a valid date.`);
          }
          validated[field.key] = raw;
          break;
        case 'select':
          if (typeof raw !== 'string' || !(field.options || []).includes(raw)) {
            throw new BadRequestException(`"${field.label}" must be one of: ${(field.options || []).join(', ')}.`);
          }
          validated[field.key] = raw;
          break;
      }
    }
    return validated;
  }

  private cachedLimit: number | null = null;

  private async getDefaultLimit(): Promise<number> {
    if (this.cachedLimit) return this.cachedLimit;
    const s = await this.prisma.setting.findUnique({ where: { key: 'pagination_default_limit' } });
    this.cachedLimit = s ? parseInt(s.value, 10) || 20 : 20;
    return this.cachedLimit;
  }

  async create(dto: CreateOrderDto) {
    // service_id is a plain string column (no formal FK — matches this
    // model's existing loosely-typed convention), so look the service up
    // manually rather than via a Prisma relation.
    const service = dto.service_id
      ? await this.prisma.service.findUnique({ where: { id: dto.service_id } })
      : null;

    if (service?.requires_file_upload && !dto.upload_id) {
      throw new BadRequestException(service.file_upload_label ? `Please upload: ${service.file_upload_label}` : 'This service requires a file upload.');
    }

    const customFieldDefs = (service?.custom_fields as unknown as CustomFieldDefDto[]) || [];
    const validatedCustomFields = customFieldDefs.length
      ? this.validateCustomFieldValues(customFieldDefs, dto.custom_field_values || {})
      : undefined;

    const order = await this.prisma.order.create({
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
        custom_field_values: validatedCustomFields as any,
      },
    });

    // Attach the upload only after the order exists — attachToOrder looks the
    // upload up server-side and marks it used, it never trusts client file metadata.
    if (dto.upload_id) {
      await this.uploads.attachToOrder(dto.upload_id, order.id, service?.file_upload_label ?? null);
    }

    return order;
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

  /**
   * Everything the admin order-detail view needs in one call: the order,
   * any uploaded files, the slot it booked (if the service required one —
   * looked up via Slot.order_id, the same link /slots/:id/book already
   * writes; no new column needed), and the service's custom_fields
   * definitions so the frontend can render labels generically instead of
   * guessing from raw keys.
   */
  async findOneWithDetails(id: string) {
    const order = await this.findOne(id);
    const [files, slot, service] = await Promise.all([
      this.prisma.orderFile.findMany({ where: { order_id: id }, orderBy: { created_at: 'asc' } }),
      this.prisma.slot.findFirst({ where: { order_id: id } }),
      order.service_id ? this.prisma.service.findUnique({ where: { id: order.service_id } }) : null,
    ]);
    return {
      ...order,
      files,
      slot,
      custom_field_defs: (service?.custom_fields as unknown as CustomFieldDefDto[]) || [],
    };
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
