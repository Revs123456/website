import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyTip } from './entities/daily-tip.entity';

@Injectable()
export class DailyTipsService {
  constructor(@InjectRepository(DailyTip) private repo: Repository<DailyTip>) {}
  findAll() { return this.repo.find({ order: { created_at: 'DESC' } }); }
  async findRandom() {
    const all = await this.repo.find({ where: { active: true } });
    if (!all.length) return null;
    return all[Math.floor(Math.random() * all.length)];
  }
  create(data: Partial<DailyTip>) { return this.repo.save(data); }
  async update(id: string, data: Partial<DailyTip>) { await this.repo.update(id, data); return this.repo.findOne({ where: { id } }); }
  async remove(id: string) { await this.repo.delete(id); return { deleted: true }; }
}
