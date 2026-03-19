import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from './entities/course.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly coursesRepository: Repository<Course>,
  ) {}

  create(createCourseDto: CreateCourseDto) {
    const course = this.coursesRepository.create(createCourseDto);
    return this.coursesRepository.save(course);
  }

  findAll() {
    return this.coursesRepository.find({ order: { created_at: 'DESC' } });
  }

  async findOne(id: string) {
    const course = await this.coursesRepository.findOne({ where: { id } });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async update(id: string, updateCourseDto: UpdateCourseDto) {
    const course = await this.findOne(id);
    Object.assign(course, updateCourseDto);
    return this.coursesRepository.save(course);
  }

  async remove(id: string) {
    const course = await this.findOne(id);
    return this.coursesRepository.remove(course);
  }
}
