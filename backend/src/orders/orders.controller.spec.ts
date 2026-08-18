import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

describe('OrdersController', () => {
  let controller: OrdersController;
  let ordersService: { create: jest.Mock; findAll: jest.Mock; findOne: jest.Mock; update: jest.Mock; remove: jest.Mock };

  beforeEach(async () => {
    ordersService = { create: jest.fn(), findAll: jest.fn(), findOne: jest.fn(), update: jest.fn(), remove: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [{ provide: OrdersService, useValue: ordersService }],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
  });

  it('create delegates the DTO', () => {
    const dto = { name: 'Jane' } as any;
    controller.create(dto);
    expect(ordersService.create).toHaveBeenCalledWith(dto);
  });

  it('findAll defaults to page 1 and an unspecified limit when query params are absent', () => {
    controller.findAll(undefined, undefined);
    expect(ordersService.findAll).toHaveBeenCalledWith(1, undefined);
  });

  it('findAll parses page and limit query params to numbers', () => {
    controller.findAll('3', '25');
    expect(ordersService.findAll).toHaveBeenCalledWith(3, 25);
  });

  it('findOne delegates the id', () => {
    controller.findOne('order-1');
    expect(ordersService.findOne).toHaveBeenCalledWith('order-1');
  });

  it('update delegates id and body', () => {
    const body = { status: 'confirmed' } as any;
    controller.update('order-1', body);
    expect(ordersService.update).toHaveBeenCalledWith('order-1', body);
  });

  it('remove delegates the id', () => {
    controller.remove('order-1');
    expect(ordersService.remove).toHaveBeenCalledWith('order-1');
  });
});
