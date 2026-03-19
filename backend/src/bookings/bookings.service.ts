import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking } from './entities/booking.entity';

@Injectable()
export class BookingsService {
  constructor(@InjectRepository(Booking) private repo: Repository<Booking>) {}
  findAll() { return this.repo.find({ order: { created_at: 'DESC' } }); }
  findOne(id: string) { return this.repo.findOne({ where: { id } }); }
  create(data: Partial<Booking>) { return this.repo.save(data); }
  async update(id: string, data: Partial<Booking>) { await this.repo.update(id, data); return this.repo.findOne({ where: { id } }); }
  async remove(id: string) { await this.repo.delete(id); return { deleted: true }; }
}
