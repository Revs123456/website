import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalaryInsight } from './entities/salary-insight.entity';

@Injectable()
export class SalaryInsightsService {
  constructor(@InjectRepository(SalaryInsight) private repo: Repository<SalaryInsight>) {}
  findAll() { return this.repo.find({ order: { role: 'ASC' } }); }
  findOne(id: string) { return this.repo.findOne({ where: { id } }); }
  create(data: Partial<SalaryInsight>) { return this.repo.save(data); }
  async update(id: string, data: Partial<SalaryInsight>) { await this.repo.update(id, data); return this.repo.findOne({ where: { id } }); }
  async remove(id: string) { await this.repo.delete(id); return { deleted: true }; }
}
