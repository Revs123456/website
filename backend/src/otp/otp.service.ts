import { BadRequestException, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

@Injectable()
export class OtpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async send(email: string): Promise<void> {
    await this.prisma.otpCode.deleteMany({ where: { email } });

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expires_at = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.otpCode.create({
      data: { email, code: hashCode(code), expires_at },
    });

    await this.mail.sendOtp(email, code);
  }

  async verify(email: string, code: string): Promise<void> {
    const otp = await this.prisma.otpCode.findFirst({
      where: { email, code: hashCode(code), used: false },
      orderBy: { created_at: 'desc' },
    });

    if (!otp) throw new BadRequestException('Invalid OTP code.');
    if (otp.expires_at < new Date()) throw new BadRequestException('OTP has expired. Please request a new one.');

    await this.prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } });
  }
}
