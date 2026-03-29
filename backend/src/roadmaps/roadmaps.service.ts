import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Roadmap } from './entities/roadmap.entity';

@Injectable()
export class RoadmapsService {
  constructor(@InjectRepository(Roadmap) private repo: Repository<Roadmap>) {}

  findAll() { return this.repo.find({ order: { created_at: 'DESC' } }); }

  findPublished() { return this.repo.find({ where: { published: true }, order: { created_at: 'DESC' } }); }

  async findOne(id: string) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Roadmap not found');
    return item;
  }

  create(data: Partial<Roadmap>) { return this.repo.save(data); }

  async update(id: string, data: Partial<Roadmap>) {
    await this.findOne(id);
    await this.repo.update(id, data as any);
    return this.repo.findOne({ where: { id } });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.repo.delete(id);
    return { deleted: true };
  }
}
