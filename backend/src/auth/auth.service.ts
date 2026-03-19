import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from './entities/admin.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
  ) {}

  async listAdmins() {
    const admins = await this.adminRepository.find();
    return admins.map(a => ({ id: a.id, email: a.email }));
  }

  async createAdmin(email: string, password: string) {
    const existing = await this.adminRepository.findOne({ where: { email } });
    if (existing) return { message: 'Admin already exists', email };
    await this.adminRepository.save({ email, passwordHash: password });
    return { message: 'Admin created', email };
  }

  async deleteAdmin(id: string) {
    await this.adminRepository.delete(id);
    return { message: 'Admin removed' };
  }

  async login(loginDto: LoginDto) {
    const admin = await this.adminRepository.findOne({ where: { email: loginDto.email } });
    if (admin) {
      if (admin.passwordHash !== loginDto.password) {
        throw new UnauthorizedException('Invalid password');
      }
      return { role: 'admin', email: admin.email };
    }
    // Non-admin emails are treated as regular users
    return { role: 'user', email: loginDto.email };
  }
}
