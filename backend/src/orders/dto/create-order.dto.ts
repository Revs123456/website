import { IsEmail, IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { IsOptionalUrl } from '../../common/decorators/is-optional-url.decorator';

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

  @IsOptionalUrl({ protocols: ['https'], require_tld: true }) @MaxLength(500)
  resume_file?: string;

  // ── Dynamic service requirements — see SERVICES_ARCHITECTURE.md ──
  // References an UploadedFile created via POST /v1/uploads. Looked up and
  // validated server-side in OrdersService, never trusted as-is.
  @IsOptional() @IsUUID()
  upload_id?: string;

  // Loosely typed here on purpose — validated against the selected
  // service's own custom_fields schema in OrdersService.validateCustomFieldValues,
  // since the required shape depends on which service was selected, not a
  // fixed shape this DTO alone could express.
  @IsOptional() @IsObject()
  custom_field_values?: Record<string, unknown>;

  // status is intentionally excluded — clients cannot set order status
}
