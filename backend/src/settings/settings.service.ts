import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './entities/setting.entity';

@Injectable()
export class SettingsService {
  constructor(@InjectRepository(Setting) private repo: Repository<Setting>) {}

  findAll() {
    return this.repo.find();
  }

  async findOne(key: string) {
    return this.repo.findOne({ where: { key } });
  }

  async upsert(key: string, value: string, label?: string, description?: string) {
    await this.repo.upsert({ key, value, label, description }, ['key']);
    return this.repo.findOne({ where: { key } });
  }

  async updateMany(updates: { key: string; value: string }[]) {
    for (const { key, value } of updates) {
      await this.repo.update({ key }, { value });
    }
    return this.findAll();
  }

  async getMap(): Promise<Record<string, string>> {
    const all = await this.repo.find();
    return Object.fromEntries(all.map(s => [s.key, s.value]));
  }
}
