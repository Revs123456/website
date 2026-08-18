import { IsEmail, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

export class VerifyOtpDto {
  @IsEmail()
  @MaxLength(200)
  email: string;

  @IsString()
  @Length(6, 6)
  code: string;

  // Optional — carried from the signup form so we set name on first verify
  @IsOptional()
  @IsString()
  @Length(1, 80)
  name?: string;

  // Optional referral code — captured from ?ref= URL param at signup time.
  // Format-validated here; existence checked in UsersService.verifyOtp.
  @IsOptional()
  @IsString()
  @Length(4, 12)
  @Matches(/^[A-Z0-9]+$/i, { message: 'Invalid referral code format' })
  ref_code?: string;
}
