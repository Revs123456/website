import { IsOptional, IsString, IsBoolean, MaxLength, IsUrl, IsISO8601 } from 'class-validator';

export class CreateJobDto {
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsString() @MaxLength(200) company?: string;
  @IsOptional() @IsString() @MaxLength(200) location?: string;
  @IsOptional() @IsString() @MaxLength(100) experience?: string;
  @IsOptional() @IsString() @MaxLength(50) type?: string;
  @IsOptional() @IsString() @MaxLength(100) category?: string;
  @IsOptional() @IsString() @MaxLength(100) salary?: string;
  @IsOptional() @IsString() @MaxLength(20000) description?: string;
  @IsOptional() @IsString() @MaxLength(10000) requirements?: string;
  @IsOptional() @IsString() @MaxLength(5000) benefits?: string;
  @IsOptional() @IsString() @MaxLength(500) tech_stack?: string;
  @IsOptional() @IsUrl() @MaxLength(500) apply_link?: string;
  @IsOptional() @IsBoolean() published?: boolean;
  @IsOptional() @IsISO8601({ strict: true }) expires_at?: string;
}
