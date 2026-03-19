import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommunityQuestion } from './entities/community-question.entity';

@Injectable()
export class CommunityService {
  constructor(@InjectRepository(CommunityQuestion) private repo: Repository<CommunityQuestion>) {}
  findAll() { return this.repo.find({ order: { created_at: 'DESC' } }); }
  findPublished() { return this.repo.find({ where: { published: true }, order: { created_at: 'DESC' } }); }
  findOne(id: string) { return this.repo.findOne({ where: { id } }); }
  create(data: Partial<CommunityQuestion>) { return this.repo.save(data); }
  async update(id: string, data: Partial<CommunityQuestion>) { await this.repo.update(id, data); return this.repo.findOne({ where: { id } }); }
  async remove(id: string) { await this.repo.delete(id); return { deleted: true }; }
}
