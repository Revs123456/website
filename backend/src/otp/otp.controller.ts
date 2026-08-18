import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { IsEmail, IsString, Length } from 'class-validator';
import { OtpService } from './otp.service';
import { Throttle } from '@nestjs/throttler';

class SendOtpDto {
  @IsEmail()
  email: string;
}

class VerifyOtpDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(6, 6)
  code: string;
}

@Controller('otp')
export class OtpController {
  constructor(private readonly svc: OtpService) {}

  @Post('send')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  async send(@Body() dto: SendOtpDto) {
    await this.svc.send(dto.email);
    return { message: 'OTP sent' };
  }

  @Post('verify')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async verify(@Body() dto: VerifyOtpDto) {
    await this.svc.verify(dto.email, dto.code);
    return { verified: true };
  }
}
