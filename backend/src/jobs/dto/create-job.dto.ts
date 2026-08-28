import { IsOptional, IsString, IsBoolean, MaxLength, IsISO8601 } from 'class-validator';
import { Transform } from 'class-transformer';
import { IsOptionalUrl } from '../../common/decorators/is-optional-url.decorator';

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
  @IsOptionalUrl() @MaxLength(500) apply_link?: string;
  @IsOptional() @IsBoolean() published?: boolean;
  // HTML <input type="date"> submits a bare "YYYY-MM-DD" — Prisma's
  // Timestamptz column needs a full ISO datetime, not just a date, or it
  // rejects the write with "premature end of input". Normalize before
  // it reaches the service.
  @Transform(({ value }) =>
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T00:00:00.000Z`).toISOString()
      : value,
  )
  @IsOptional() @IsISO8601({ strict: true }) expires_at?: string;
}
