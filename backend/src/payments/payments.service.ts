import { Injectable, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private razorpay: Razorpay;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in environment variables');
    }
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }

  async createOrder(orderId: string, _clientAmount: number) {
    this.logger.log(`createOrder called: orderId=${orderId}`);
    try {
      const order = await this.prisma.order.findUnique({ where: { id: orderId } });
      if (!order) { this.logger.error(`Order not found: ${orderId}`); throw new BadRequestException('Order not found'); }
      this.logger.log(`Order found: service_id=${order.service_id}`);

      // Always use server-side price — never trust client-provided amount
      let priceINR: number;
      if (order.service_id) {
        const service = await this.prisma.service.findUnique({ where: { id: order.service_id } });
        if (!service) { this.logger.error(`Service not found: ${order.service_id}`); throw new BadRequestException('Service not found'); }
        this.logger.log(`Service found: name=${service.name} price=${service.price}`);
        priceINR = parseFloat(String(service.price).replace(/[^0-9.]/g, '')) || 0;
        if (priceINR <= 0) { this.logger.error(`Invalid price: ${service.price}`); throw new BadRequestException('Invalid service price'); }
      } else {
        // Slot booking: price from settings, fallback to 500
        const priceSetting = await this.prisma.setting.findUnique({ where: { key: 'slot_booking_price' } });
        priceINR = priceSetting ? (parseFloat(priceSetting.value) || 500) : 500;
      }
      const amountInPaise = Math.round(priceINR * 100);
      this.logger.log(`Calling Razorpay: amount=${amountInPaise} paise`);

      let razorpayOrder: any;
      try {
        razorpayOrder = await this.razorpay.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: orderId,
        });
        this.logger.log(`Razorpay order created: ${razorpayOrder.id}`);
      } catch (rzpErr: any) {
        const msg = rzpErr?.error?.description || rzpErr?.message || 'Razorpay order creation failed';
        this.logger.error(`Razorpay error: ${msg}`, rzpErr);
        throw new InternalServerErrorException(msg);
      }

      await this.prisma.$executeRaw`
        UPDATE orders
        SET razorpay_order_id = ${razorpayOrder.id},
            amount = ${priceINR}::numeric
        WHERE id = ${orderId}::uuid
      `;

      return {
        razorpay_order_id: razorpayOrder.id,
        amount: amountInPaise,
        currency: 'INR',
        key_id: process.env.RAZORPAY_KEY_ID,
      };
    } catch (err: any) {
      // Re-throw known HTTP errors as-is
      if (err?.getStatus) throw err;
      // Surface the real message for everything else
      const msg = err?.message || 'Payment processing failed';
      this.logger.error(`createOrder unexpected error: ${msg}`, err?.stack);
      throw new InternalServerErrorException(msg);
    }
  }

  async verifyPayment(body: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) {
    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== body.razorpay_signature) {
      throw new BadRequestException('Invalid payment signature');
    }

    // Confirm payment was actually captured on Razorpay's side — prevents HMAC-only bypass
    let rzpPayment: any;
    try {
      rzpPayment = await (this.razorpay.payments as any).fetch(body.razorpay_payment_id);
    } catch {
      throw new BadRequestException('Unable to verify payment with Razorpay');
    }
    if (rzpPayment.status !== 'captured' && rzpPayment.status !== 'authorized') {
      throw new BadRequestException('Payment not captured');
    }
    if (rzpPayment.order_id !== body.razorpay_order_id) {
      throw new BadRequestException('Payment order mismatch');
    }

    // Verify amount matches what we created the order for (prevent partial payment)
    const dbOrder = await this.prisma.order.findFirst({ where: { razorpay_order_id: body.razorpay_order_id } });
    if (dbOrder?.amount) {
      const expectedPaise = Math.round(parseFloat(String(dbOrder.amount)) * 100);
      if (rzpPayment.amount !== expectedPaise) {
        throw new BadRequestException('Payment amount mismatch');
      }
    }

    await this.prisma.order.updateMany({
      where: { razorpay_order_id: body.razorpay_order_id },
      data: {
        razorpay_payment_id: body.razorpay_payment_id,
        payment_status: 'paid',
        status: 'confirmed',
      },
    });

    // Send confirmation emails (non-blocking)
    const order = await this.prisma.order.findFirst({ where: { razorpay_order_id: body.razorpay_order_id } });
    if (order) {
      const name = order.customer_name || order.name || 'Customer';
      const email = order.customer_email || order.email;
      const service = order.service_type || 'Service';
      const amount = order.amount ? `₹${order.amount}` : '';

      if (email) {
        Promise.all([
          this.mail.sendOrderConfirmation({ name, email, service, order_id: order.id, amount }).catch(err => console.error('[MAIL] Order confirmation failed:', err)),
          this.mail.sendAdminOrderAlert({ name, email, service, order_id: order.id, amount }).catch(err => console.error('[MAIL] Admin order alert failed:', err)),
        ]);
      }
    }

    return { success: true, message: 'Payment verified successfully' };
  }
}
