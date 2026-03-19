import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly servicesRepository: Repository<Service>,
  ) {}

  create(createServiceDto: CreateServiceDto) {
    const service = this.servicesRepository.create(createServiceDto);
    return this.servicesRepository.save(service);
  }

  findAll() {
    return this.servicesRepository.find();
  }

  async findOne(id: string) {
    const service = await this.servicesRepository.findOne({ where: { id } });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async update(id: string, updateServiceDto: UpdateServiceDto) {
    const service = await this.findOne(id);
    Object.assign(service, updateServiceDto);
    return this.servicesRepository.save(service);
  }

  async remove(id: string) {
    const service = await this.findOne(id);
    return this.servicesRepository.remove(service);
  }
}
