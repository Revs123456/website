import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResumeTemplate } from './entities/resume-template.entity';

@Injectable()
export class ResumeTemplatesService {
  constructor(@InjectRepository(ResumeTemplate) private repo: Repository<ResumeTemplate>) {}
  findAll() { return this.repo.find({ order: { created_at: 'DESC' } }); }
  findPublished() { return this.repo.find({ where: { published: true }, order: { created_at: 'DESC' } }); }
  findOne(id: string) { return this.repo.findOne({ where: { id } }); }
  create(data: Partial<ResumeTemplate>) { return this.repo.save(data); }
  async update(id: string, data: Partial<ResumeTemplate>) { await this.repo.update(id, data); return this.repo.findOne({ where: { id } }); }
  async remove(id: string) { await this.repo.delete(id); return { deleted: true }; }
}
