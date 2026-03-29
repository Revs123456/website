import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Testimonial } from './entities/testimonial.entity';

@Injectable()
export class TestimonialsService {
  constructor(@InjectRepository(Testimonial) private repo: Repository<Testimonial>) {}

  findAll() { return this.repo.find({ order: { created_at: 'DESC' } }); }
  findPublished() { return this.repo.find({ where: { published: true }, order: { created_at: 'DESC' } }); }
  async findOne(id: string) { const item = await this.repo.findOne({ where: { id } }); if (!item) throw new NotFoundException(); return item; }
  create(data: Partial<Testimonial>) { return this.repo.save(data); }
  async update(id: string, data: Partial<Testimonial>) {
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }
  async remove(id: string) { await this.repo.delete(id); return { deleted: true }; }
}
