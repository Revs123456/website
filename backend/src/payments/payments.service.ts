import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';
import { Order } from '../orders/entities/order.entity';

@Injectable()
export class PaymentsService {
  private razorpay: Razorpay;

  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
  ) {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_PLACEHOLDER',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'PLACEHOLDER_SECRET',
    });
  }

  async createOrder(orderId: string, amount: number) {
    const order = await this.ordersRepository.findOne({ where: { id: orderId } });
    if (!order) throw new BadRequestException('Order not found');

    const amountInPaise = Math.round(amount * 100);

    const razorpayOrder = await this.razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: orderId,
    });

    await this.ordersRepository.update(orderId, {
      razorpay_order_id: razorpayOrder.id,
      amount,
    });

    return {
      razorpay_order_id: razorpayOrder.id,
      amount: amountInPaise,
      currency: 'INR',
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_PLACEHOLDER',
    };
  }

  async verifyPayment(body: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) {
    const secret = process.env.RAZORPAY_KEY_SECRET || 'PLACEHOLDER_SECRET';
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== body.razorpay_signature) {
      throw new BadRequestException('Invalid payment signature');
    }

    await this.ordersRepository.update(
      { razorpay_order_id: body.razorpay_order_id },
      {
        razorpay_payment_id: body.razorpay_payment_id,
        payment_status: 'paid',
        status: 'confirmed',
      },
    );

    return { success: true, message: 'Payment verified successfully' };
  }
}
