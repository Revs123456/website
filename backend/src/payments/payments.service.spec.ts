import { Test, TestingModule } from '@nestjs/testing';
import * as crypto from 'crypto';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { createMockPrismaService, MockPrismaService } from '../../test/helpers/mock-prisma';

// PaymentsService builds its own Razorpay client in the constructor, so we
// replace the whole SDK with a controllable fake and reach into the private
// `razorpay` field on the constructed service to program its responses.
jest.mock('razorpay', () => {
  return jest.fn().mockImplementation(() => ({
    orders: { create: jest.fn() },
    payments: { fetch: jest.fn() },
  }));
});

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: MockPrismaService;
  let mail: { sendOrderConfirmation: jest.Mock; sendAdminOrderAlert: jest.Mock };
  let razorpay: { orders: { create: jest.Mock }; payments: { fetch: jest.Mock } };

  beforeEach(async () => {
    prisma = createMockPrismaService();
    mail = { sendOrderConfirmation: jest.fn().mockResolvedValue(undefined), sendAdminOrderAlert: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        PrismaService,
        { provide: MailService, useValue: mail },
      ],
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    service = module.get<PaymentsService>(PaymentsService);
    razorpay = (service as any).razorpay;
  });

  describe('createOrder', () => {
    it('prices from the linked service and creates a Razorpay order', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: 'order-1', service_id: 'svc-1' });
      prisma.service.findUnique.mockResolvedValue({ id: 'svc-1', name: 'Resume Review', price: '₹1,499' });
      razorpay.orders.create.mockResolvedValue({ id: 'rzp_order_1' });
      prisma.$executeRaw.mockResolvedValue(undefined);

      const result = await service.createOrder('order-1', 999 /* ignored — server-priced */);

      expect(razorpay.orders.create).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 149900, currency: 'INR', receipt: 'order-1' }),
      );
      expect(result.razorpay_order_id).toBe('rzp_order_1');
      expect(result.amount).toBe(149900);
    });

    it('falls back to the slot-booking price setting when there is no linked service', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: 'order-2', service_id: null });
      prisma.setting.findUnique.mockResolvedValue({ value: '750' });
      razorpay.orders.create.mockResolvedValue({ id: 'rzp_order_2' });
      prisma.$executeRaw.mockResolvedValue(undefined);

      const result = await service.createOrder('order-2', 0);

      expect(razorpay.orders.create).toHaveBeenCalledWith(expect.objectContaining({ amount: 75000 }));
      expect(result.amount).toBe(75000);
    });

    it('defaults to ₹500 for a slot booking when no price setting exists', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: 'order-3', service_id: null });
      prisma.setting.findUnique.mockResolvedValue(null);
      razorpay.orders.create.mockResolvedValue({ id: 'rzp_order_3' });
      prisma.$executeRaw.mockResolvedValue(undefined);

      const result = await service.createOrder('order-3', 0);

      expect(result.amount).toBe(50000);
    });

    it('rejects when the order does not exist', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      await expect(service.createOrder('missing', 100)).rejects.toThrow(BadRequestException);
      expect(razorpay.orders.create).not.toHaveBeenCalled();
    });

    it('rejects when the linked service has an invalid price', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: 'order-4', service_id: 'svc-1' });
      prisma.service.findUnique.mockResolvedValue({ id: 'svc-1', name: 'Free Thing', price: '₹0' });
      await expect(service.createOrder('order-4', 100)).rejects.toThrow(BadRequestException);
      expect(razorpay.orders.create).not.toHaveBeenCalled();
    });

    it('surfaces a Razorpay failure as a 500', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: 'order-5', service_id: null });
      prisma.setting.findUnique.mockResolvedValue({ value: '500' });
      razorpay.orders.create.mockRejectedValue(new Error('network down'));

      await expect(service.createOrder('order-5', 100)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('verifyPayment', () => {
    function sign(orderId: string, paymentId: string) {
      return crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!).update(`${orderId}|${paymentId}`).digest('hex');
    }

    it('rejects an invalid signature before calling Razorpay', async () => {
      await expect(
        service.verifyPayment({
          razorpay_order_id: 'rzp_order_1',
          razorpay_payment_id: 'pay_1',
          razorpay_signature: 'not-the-real-signature',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(razorpay.payments.fetch).not.toHaveBeenCalled();
    });

    it('rejects a payment that was not captured or authorized', async () => {
      razorpay.payments.fetch.mockResolvedValue({ status: 'failed', order_id: 'rzp_order_1', amount: 50000 });

      await expect(
        service.verifyPayment({
          razorpay_order_id: 'rzp_order_1',
          razorpay_payment_id: 'pay_1',
          razorpay_signature: sign('rzp_order_1', 'pay_1'),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects when the Razorpay order id does not match', async () => {
      razorpay.payments.fetch.mockResolvedValue({ status: 'captured', order_id: 'some_other_order', amount: 50000 });

      await expect(
        service.verifyPayment({
          razorpay_order_id: 'rzp_order_1',
          razorpay_payment_id: 'pay_1',
          razorpay_signature: sign('rzp_order_1', 'pay_1'),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects when the captured amount does not match the stored order amount', async () => {
      razorpay.payments.fetch.mockResolvedValue({ status: 'captured', order_id: 'rzp_order_1', amount: 1 });
      prisma.order.findFirst.mockResolvedValue({ amount: '500' }); // expects 50000 paise

      await expect(
        service.verifyPayment({
          razorpay_order_id: 'rzp_order_1',
          razorpay_payment_id: 'pay_1',
          razorpay_signature: sign('rzp_order_1', 'pay_1'),
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.order.updateMany).not.toHaveBeenCalled();
    });

    it('marks the order paid and confirmed on a fully valid payment', async () => {
      razorpay.payments.fetch.mockResolvedValue({ status: 'captured', order_id: 'rzp_order_1', amount: 50000 });
      prisma.order.findFirst
        .mockResolvedValueOnce({ amount: '500' }) // amount-match lookup
        .mockResolvedValueOnce({ id: 'order-1', customer_name: 'Jane', customer_email: 'jane@test.com', service_type: 'Resume Review', amount: '500' }); // post-update lookup for email
      prisma.order.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.verifyPayment({
        razorpay_order_id: 'rzp_order_1',
        razorpay_payment_id: 'pay_1',
        razorpay_signature: sign('rzp_order_1', 'pay_1'),
      });

      expect(prisma.order.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { razorpay_order_id: 'rzp_order_1' },
          data: expect.objectContaining({ payment_status: 'paid', status: 'confirmed' }),
        }),
      );
      expect(result).toEqual({ success: true, message: 'Payment verified successfully' });
    });
  });
});
