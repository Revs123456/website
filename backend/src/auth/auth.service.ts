import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Admin } from './entities/admin.entity';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    private readonly jwtService: JwtService,
  ) {}

  async listAdmins() {
    const admins = await this.adminRepository.find();
    return admins.map(a => ({ id: a.id, email: a.email }));
  }

  async createAdmin(email: string, password: string) {
    const existing = await this.adminRepository.findOne({ where: { email } });
    if (existing) return { message: 'Admin already exists', email };
    const passwordHash = await bcrypt.hash(password, 10);
    await this.adminRepository.save({ email, passwordHash });
    return { message: 'Admin created', email };
  }

  async deleteAdmin(id: string) {
    await this.adminRepository.delete(id);
    return { message: 'Admin removed' };
  }

  async login(loginDto: LoginDto) {
    const admin = await this.adminRepository.findOne({ where: { email: loginDto.email } });
    if (admin) {
      const valid = await bcrypt.compare(loginDto.password, admin.passwordHash);
      if (!valid) throw new UnauthorizedException('Invalid password');
      const token = this.jwtService.sign({ sub: admin.id, email: admin.email, role: 'admin' });
      return { role: 'admin', email: admin.email, token };
    }
    return { role: 'user', email: loginDto.email };
  }
}
