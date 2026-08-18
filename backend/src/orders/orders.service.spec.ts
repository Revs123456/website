import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService, MockPrismaService } from '../../test/helpers/mock-prisma';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrdersService, PrismaService],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    service = module.get<OrdersService>(OrdersService);
  });

  describe('create', () => {
    it('passes the DTO fields straight through to Prisma', () => {
      const dto = { name: 'Jane', email: 'jane@test.com', service_type: 'resume' } as any;
      prisma.order.create.mockResolvedValue({ id: 'order-1', ...dto });

      service.create(dto);

      expect(prisma.order.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ name: 'Jane', email: 'jane@test.com', service_type: 'resume' }),
      });
    });
  });

  describe('findAll', () => {
    it('uses the pagination_default_limit setting the first time, then caches it', async () => {
      prisma.setting.findUnique.mockResolvedValue({ value: '10' });
      prisma.order.findMany.mockResolvedValue([]);

      await service.findAll(1);
      await service.findAll(2);

      expect(prisma.setting.findUnique).toHaveBeenCalledTimes(1); // cached on the second call
      expect(prisma.order.findMany).toHaveBeenNthCalledWith(1, expect.objectContaining({ skip: 0, take: 10 }));
      expect(prisma.order.findMany).toHaveBeenNthCalledWith(2, expect.objectContaining({ skip: 10, take: 10 }));
    });

    it('caps the limit at 200 even if a caller asks for more', async () => {
      prisma.order.findMany.mockResolvedValue([]);
      await service.findAll(1, 5000);
      expect(prisma.order.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 200 }));
    });
  });

  describe('findOne', () => {
    it('returns the order when found', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: 'order-1' });
      await expect(service.findOne('order-1')).resolves.toEqual({ id: 'order-1' });
    });

    it('throws NotFoundException when missing', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('checks existence before updating', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: 'order-1' });
      prisma.order.update.mockResolvedValue({ id: 'order-1', status: 'confirmed' });

      const result = await service.update('order-1', { status: 'confirmed' });

      expect(prisma.order.update).toHaveBeenCalledWith({ where: { id: 'order-1' }, data: { status: 'confirmed' } });
      expect(result.status).toBe('confirmed');
    });

    it('throws NotFoundException instead of updating a missing order', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(service.update('missing', {})).rejects.toThrow(NotFoundException);
      expect(prisma.order.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('checks existence before deleting', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: 'order-1' });
      prisma.order.delete.mockResolvedValue({ id: 'order-1' });

      await service.remove('order-1');

      expect(prisma.order.delete).toHaveBeenCalledWith({ where: { id: 'order-1' } });
    });

    it('throws NotFoundException instead of deleting a missing order', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
      expect(prisma.order.delete).not.toHaveBeenCalled();
    });
  });
});
