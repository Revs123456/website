import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Blog } from './entities/blog.entity';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';

@Injectable()
export class BlogsService {
  constructor(@InjectRepository(Blog) private repo: Repository<Blog>) {}

  create(dto: CreateBlogDto) { return this.repo.save(dto); }

  findAll() { return this.repo.find({ order: { created_at: 'DESC' } }); }

  findPublished() { return this.repo.find({ where: { published: true }, order: { created_at: 'DESC' } }); }

  async findOne(id: string) {
    const b = await this.repo.findOne({ where: { id } });
    if (!b) throw new NotFoundException();
    return b;
  }

  async update(id: string, dto: UpdateBlogDto) {
    await this.repo.update(id, dto as any);
    return this.findOne(id);
  }

  async remove(id: string) { await this.repo.delete(id); }
}
