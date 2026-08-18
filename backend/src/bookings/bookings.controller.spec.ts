import { Test, TestingModule } from '@nestjs/testing';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

describe('BookingsController', () => {
  let controller: BookingsController;
  let bookingsService: { findAll: jest.Mock; findOne: jest.Mock; create: jest.Mock; update: jest.Mock; remove: jest.Mock };

  beforeEach(async () => {
    bookingsService = { findAll: jest.fn(), findOne: jest.fn(), create: jest.fn(), update: jest.fn(), remove: jest.fn() };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [{ provide: BookingsService, useValue: bookingsService }],
    }).compile();

    controller = module.get<BookingsController>(BookingsController);
  });

  it('findAll parses page/limit query strings to numbers', () => {
    controller.findAll('2', '30');
    expect(bookingsService.findAll).toHaveBeenCalledWith(2, 30);
  });

  it('findOne delegates the id', () => {
    controller.findOne('b1');
    expect(bookingsService.findOne).toHaveBeenCalledWith('b1');
  });

  it('create delegates the DTO', () => {
    const dto = { name: 'Jane' } as any;
    controller.create(dto);
    expect(bookingsService.create).toHaveBeenCalledWith(dto);
  });

  it('update delegates id and body', () => {
    controller.update('b1', { notes: 'x' });
    expect(bookingsService.update).toHaveBeenCalledWith('b1', { notes: 'x' });
  });

  it('remove delegates the id', () => {
    controller.remove('b1');
    expect(bookingsService.remove).toHaveBeenCalledWith('b1');
  });
});
