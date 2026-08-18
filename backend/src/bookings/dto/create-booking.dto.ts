import { IsString, IsEmail, IsOptional, MaxLength } from 'class-validator';

export class CreateBookingDto {
  @IsString() @MaxLength(100)
  name: string;

  @IsEmail() @MaxLength(200)
  email: string;

  @IsOptional() @IsString() @MaxLength(20)
  phone?: string;

  @IsString() @MaxLength(50)
  experience: string;

  @IsString() @MaxLength(100)
  role: string;

  @IsOptional() @IsString() @MaxLength(50)
  preferred_date?: string;

  @IsOptional() @IsString() @MaxLength(20)
  preferred_time?: string;

  @IsOptional() @IsString() @MaxLength(2000)
  notes?: string;
}
