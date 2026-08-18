import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function parseExpiryToMs(expiry: string): number {
  const m = expiry.match(/^(\d+)([smhd])$/);
  if (!m) return 15 * 60 * 1000;
  const n = parseInt(m[1], 10);
  switch (m[2]) {
    case 's': return n * 1000;
    case 'm': return n * 60 * 1000;
    case 'h': return n * 60 * 60 * 1000;
    case 'd': return n * 24 * 60 * 60 * 1000;
    default:  return 15 * 60 * 1000;
  }
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async listAdmins() {
    const admins = await this.prisma.admin.findMany();
    return admins.map(a => ({ id: a.id, email: a.email }));
  }

  async createAdmin(email: string, password: string) {
    const existing = await this.prisma.admin.findUnique({ where: { email } });
    if (existing) return { message: 'Admin already exists', email };
    if (password.length < 12) throw new BadRequestException('Password must be at least 12 characters');
    if (!/[A-Z]/.test(password)) throw new BadRequestException('Password must include at least one uppercase letter');
    if (!/[0-9]/.test(password)) throw new BadRequestException('Password must include at least one number');
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) throw new BadRequestException('Password must include at least one special character');
    const passwordHash = await bcrypt.hash(password, 12);
    await this.prisma.admin.create({ data: { email, passwordHash } });
    return { message: 'Admin created', email };
  }

  async deleteAdmin(id: string, requestingAdminId: string) {
    if (id === requestingAdminId) throw new BadRequestException('Cannot delete your own account');
    const count = await this.prisma.admin.count();
    if (count <= 1) throw new BadRequestException('Cannot delete the last admin account');
    await this.prisma.admin.delete({ where: { id } });
    return { message: 'Admin removed' };
  }

  private getJwtSecret(): string {
    return process.env.JWT_SECRET || (() => { throw new Error('JWT_SECRET env var not set'); })();
  }

  private async getAccessExpiry(): Promise<{ expiry: string; expiryMs: number }> {
    const s = await this.prisma.setting.findUnique({ where: { key: 'jwt_access_expiry' } });
    const expiry = s?.value || '15m';
    return { expiry, expiryMs: parseExpiryToMs(expiry) };
  }

  private async getRefreshTtlMs(): Promise<number> {
    const s = await this.prisma.setting.findUnique({ where: { key: 'refresh_token_ttl_days' } });
    const days = s ? (parseInt(s.value, 10) || 30) : 30;
    return days * 24 * 60 * 60 * 1000;
  }

  private async createRefreshToken(adminId: string): Promise<{ raw: string; expiryMs: number }> {
    const raw = crypto.randomBytes(40).toString('hex');
    const expiryMs = await this.getRefreshTtlMs();
    await this.prisma.refreshToken.create({
      data: {
        token_hash: hashToken(raw),
        admin_id: adminId,
        expires_at: new Date(Date.now() + expiryMs),
      },
    });
    return { raw, expiryMs };
  }

  async login(loginDto: LoginDto): Promise<{ role: string; email: string; token?: string; refreshToken?: string; accessExpiryMs?: number; refreshExpiryMs?: number }> {
    const admin = await this.prisma.admin.findUnique({ where: { email: loginDto.email } });
    // Always run bcrypt compare (even for non-existent users) to prevent timing-based user enumeration
    const dummyHash = '$2b$10$invalidhashpaddingtopreventimenumeration000000000000000';
    const valid = admin ? await bcrypt.compare(loginDto.password, admin.passwordHash) : await bcrypt.compare(loginDto.password, dummyHash).then(() => false);
    if (!admin || !valid) throw new UnauthorizedException('Invalid credentials');
    const { expiry, expiryMs: accessExpiryMs } = await this.getAccessExpiry();
    const token = jwt.sign({ sub: admin.id, email: admin.email, role: 'admin' }, this.getJwtSecret(), { expiresIn: expiry as any });
    const { raw: refreshToken, expiryMs: refreshExpiryMs } = await this.createRefreshToken(admin.id);
    return { role: 'admin', email: admin.email, token, refreshToken, accessExpiryMs, refreshExpiryMs };
  }

  async refresh(rawRefreshToken: string): Promise<{ token: string; refreshToken: string; accessExpiryMs: number; refreshExpiryMs: number }> {
    const stored = await this.prisma.refreshToken.findUnique({ where: { token_hash: hashToken(rawRefreshToken) } });
    if (!stored || stored.expires_at < new Date()) {
      if (stored) await this.prisma.refreshToken.delete({ where: { id: stored.id } });
      throw new UnauthorizedException('Refresh token expired or invalid');
    }

    const admin = await this.prisma.admin.findUnique({ where: { id: stored.admin_id } });
    if (!admin) throw new UnauthorizedException();

    // Rotate: delete old, issue new
    await this.prisma.refreshToken.delete({ where: { id: stored.id } });
    const { expiry, expiryMs: accessExpiryMs } = await this.getAccessExpiry();
    const token = jwt.sign({ sub: admin.id, email: admin.email, role: 'admin' }, this.getJwtSecret(), { expiresIn: expiry as any });
    const { raw: refreshToken, expiryMs: refreshExpiryMs } = await this.createRefreshToken(admin.id);
    return { token, refreshToken, accessExpiryMs, refreshExpiryMs };
  }

  async logout(rawRefreshToken?: string): Promise<void> {
    if (!rawRefreshToken) return;
    await this.prisma.refreshToken.deleteMany({ where: { token_hash: hashToken(rawRefreshToken) } });
  }

  // Runs daily at midnight — removes abandoned/expired sessions that were never explicitly logged out
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredTokens(): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { expires_at: { lt: new Date() } } });
  }
}
