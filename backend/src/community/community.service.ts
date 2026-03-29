import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommunityQuestion } from './entities/community-question.entity';

@Injectable()
export class CommunityService {
  constructor(@InjectRepository(CommunityQuestion) private repo: Repository<CommunityQuestion>) {}
  findAll() { return this.repo.find({ order: { created_at: 'DESC' } }); }
  findPublished() { return this.repo.find({ where: { published: true }, order: { created_at: 'DESC' } }); }
  async findOne(id: string) { const item = await this.repo.findOne({ where: { id } }); if (!item) throw new NotFoundException(); return item; }
  create(data: Partial<CommunityQuestion>) { return this.repo.save(data); }
  async update(id: string, data: any) { await this.findOne(id); await this.repo.update(id, data); return this.repo.findOne({ where: { id } }); }
  async remove(id: string) { await this.repo.delete(id); return { deleted: true }; }
}
