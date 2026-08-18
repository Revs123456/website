import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService, MockPrismaService } from '../../test/helpers/mock-prisma';

describe('BookingsService', () => {
  let service: BookingsService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    const module: TestingModule = await Test.createTestingModule({
      providers: [BookingsService, PrismaService],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    service = module.get<BookingsService>(BookingsService);
  });

  describe('findAll', () => {
    it('paginates with the given page and limit', () => {
      prisma.booking.findMany.mockResolvedValue([]);
      service.findAll(2, 20);
      expect(prisma.booking.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 20, orderBy: { created_at: 'desc' } }),
      );
    });

    it('caps the limit at 200', () => {
      prisma.booking.findMany.mockResolvedValue([]);
      service.findAll(1, 5000);
      expect(prisma.booking.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 200 }));
    });
  });

  describe('findOne', () => {
    it('returns the booking when found', async () => {
      prisma.booking.findUnique.mockResolvedValue({ id: 'b1' });
      await expect(service.findOne('b1')).resolves.toEqual({ id: 'b1' });
    });

    it('throws NotFoundException when missing', async () => {
      prisma.booking.findUnique.mockResolvedValue(null);
      await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('forwards the data straight to Prisma', () => {
      const data = { name: 'Jane', email: 'jane@test.com' };
      prisma.booking.create.mockResolvedValue({ id: 'b1', ...data });
      service.create(data);
      expect(prisma.booking.create).toHaveBeenCalledWith({ data });
    });
  });

  describe('update', () => {
    it('checks existence before updating', async () => {
      prisma.booking.findUnique.mockResolvedValue({ id: 'b1' });
      prisma.booking.update.mockResolvedValue({ id: 'b1', notes: 'rescheduled' });

      const result = await service.update('b1', { notes: 'rescheduled' });

      expect(prisma.booking.update).toHaveBeenCalledWith({ where: { id: 'b1' }, data: { notes: 'rescheduled' } });
      expect(result.notes).toBe('rescheduled');
    });

    it('throws NotFoundException instead of updating a missing booking', async () => {
      prisma.booking.findUnique.mockResolvedValue(null);
      await expect(service.update('missing', {})).rejects.toThrow(NotFoundException);
      expect(prisma.booking.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes the booking and reports success', async () => {
      prisma.booking.delete.mockResolvedValue({ id: 'b1' });
      await expect(service.remove('b1')).resolves.toEqual({ deleted: true });
      expect(prisma.booking.delete).toHaveBeenCalledWith({ where: { id: 'b1' } });
    });
  });
});
