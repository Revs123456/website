import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SuccessStory } from './entities/success-story.entity';

@Injectable()
export class SuccessStoriesService {
  constructor(@InjectRepository(SuccessStory) private repo: Repository<SuccessStory>) {}
  findAll() { return this.repo.find({ order: { created_at: 'DESC' } }); }
  findPublished() { return this.repo.find({ where: { published: true }, order: { created_at: 'DESC' } }); }
  findOne(id: string) { return this.repo.findOne({ where: { id } }); }
  create(data: Partial<SuccessStory>) { return this.repo.save(data); }
  async update(id: string, data: Partial<SuccessStory>) { await this.repo.update(id, data); return this.repo.findOne({ where: { id } }); }
  async remove(id: string) { await this.repo.delete(id); return { deleted: true }; }
}
