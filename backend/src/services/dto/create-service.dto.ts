import { IsArray, IsNotEmpty, IsOptional, IsString, MaxLength, IsBoolean, Matches, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { IsOptionalUrl } from '../../common/decorators/is-optional-url.decorator';
import { CustomFieldDefDto } from './custom-field-def.dto';

function strip(val: unknown): string {
  if (typeof val !== 'string') return '';
  // Decode common HTML entities first, then strip all tags
  return val
    .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"').replace(/&#x27;/gi, "'").replace(/&#x2F;/gi, '/')
    .replace(/&#(\d+);/gi, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&#x([a-f0-9]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/<[^>]*>/g, '')
    .trim();
}

export class CreateServiceDto {
  @IsNotEmpty() @IsString() @MaxLength(200)
  @Transform(({ value }) => strip(value))
  name!: string;

  @IsNotEmpty() @IsString() @MaxLength(5000)
  @Transform(({ value }) => strip(value))
  description!: string;

  @IsNotEmpty() @IsString() @MaxLength(50)
  @Matches(/^[a-zA-Z₹$€£¥\d\s.,+\-/()]+$/, { message: 'Price contains invalid characters' })
  price!: string;

  @IsNotEmpty() @IsString() @MaxLength(10000)
  included_features!: string;

  @IsOptionalUrl({ protocols: ['https'], require_tld: true }) @MaxLength(500)
  image_url?: string;

  @IsOptional() @IsBoolean()
  is_popular?: boolean;

  @IsOptional() @IsBoolean()
  published?: boolean;

  // ── Dynamic service configuration — see SERVICES_ARCHITECTURE.md ──
  @IsOptional() @IsBoolean()
  requires_slot?: boolean;

  @IsOptional() @IsBoolean()
  requires_file_upload?: boolean;

  @IsOptional() @IsString() @MaxLength(200)
  file_upload_label?: string;

  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CustomFieldDefDto)
  custom_fields?: CustomFieldDefDto[];
}
