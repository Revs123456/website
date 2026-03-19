import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from './entities/job.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private readonly jobsRepository: Repository<Job>,
  ) {}

  create(createJobDto: CreateJobDto) {
    const job = this.jobsRepository.create(createJobDto);
    return this.jobsRepository.save(job);
  }

  findAll() {
    return this.jobsRepository.find({ order: { created_at: 'DESC' } });
  }

  async findOne(id: string) {
    const job = await this.jobsRepository.findOne({ where: { id } });
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  async update(id: string, updateJobDto: UpdateJobDto) {
    const job = await this.findOne(id);
    Object.assign(job, updateJobDto);
    return this.jobsRepository.save(job);
  }

  async remove(id: string) {
    const job = await this.findOne(id);
    return this.jobsRepository.remove(job);
  }
}
