import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let paymentsService: { createOrder: jest.Mock; verifyPayment: jest.Mock };

  beforeEach(async () => {
    paymentsService = { createOrder: jest.fn(), verifyPayment: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [{ provide: PaymentsService, useValue: paymentsService }],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
  });

  it('delegates createOrder with the body order_id and amount', () => {
    paymentsService.createOrder.mockResolvedValue({ razorpay_order_id: 'rzp_1' });
    controller.createOrder({ order_id: 'order-1', amount: 500 });
    expect(paymentsService.createOrder).toHaveBeenCalledWith('order-1', 500);
  });

  it('delegates verifyPayment with the full body', () => {
    const body = { razorpay_order_id: 'o1', razorpay_payment_id: 'p1', razorpay_signature: 's1' };
    paymentsService.verifyPayment.mockResolvedValue({ success: true });
    controller.verifyPayment(body);
    expect(paymentsService.verifyPayment).toHaveBeenCalledWith(body);
  });
});
