import { Controller, Post, Body } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // 10 order creation attempts per hour per IP
  @Throttle({ default: { ttl: 3600000, limit: 10 } })
  @Post('create-order')
  createOrder(@Body() body: { order_id: string; amount: number }) {
    return this.paymentsService.createOrder(body.order_id, body.amount);
  }

  // 10 payment verification attempts per hour per IP
  @Throttle({ default: { ttl: 3600000, limit: 10 } })
  @Post('verify')
  verifyPayment(
    @Body() body: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
    },
  ) {
    return this.paymentsService.verifyPayment(body);
  }
}
