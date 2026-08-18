import { IsEmail, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

function sanitize(val: unknown): string {
  if (typeof val !== 'string') return '';
  // Strip HTML tags and trim
  return val.replace(/<[^>]*>/g, '').trim().slice(0, 5000);
}

export class CreateOrderDto {
  @IsOptional() @IsString() @MaxLength(200)
  @Transform(({ value }) => sanitize(value))
  name?: string;

  @IsOptional() @IsString() @MaxLength(200)
  @Transform(({ value }) => sanitize(value))
  customer_name?: string;

  @IsOptional() @IsEmail()
  email?: string;

  @IsOptional() @IsEmail()
  customer_email?: string;

  @IsOptional() @IsString() @MaxLength(100)
  @Transform(({ value }) => sanitize(value))
  service_type?: string;

  @IsOptional() @IsString() @MaxLength(100)
  service_id?: string;

  @IsOptional() @IsString() @MaxLength(100)
  @Transform(({ value }) => sanitize(value))
  experience_level?: string;

  @IsOptional() @IsString() @MaxLength(5000)
  @Transform(({ value }) => sanitize(value))
  message?: string;

  @IsOptional() @IsUrl({ protocols: ['https'], require_tld: true }) @MaxLength(500)
  resume_file?: string;

  // status is intentionally excluded — clients cannot set order status
}
