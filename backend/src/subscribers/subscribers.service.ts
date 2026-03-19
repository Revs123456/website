import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscriber } from './entities/subscriber.entity';

@Injectable()
export class SubscribersService {
  constructor(@InjectRepository(Subscriber) private repo: Repository<Subscriber>) {}
  findAll() { return this.repo.find({ order: { created_at: 'DESC' } }); }
  create(data: Partial<Subscriber>) { return this.repo.save(data); }
  async remove(id: string) { await this.repo.delete(id); return { deleted: true }; }
  count() { return this.repo.count(); }
}
