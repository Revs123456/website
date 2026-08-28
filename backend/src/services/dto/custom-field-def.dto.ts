import { IsArray, IsBoolean, IsIn, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export const CUSTOM_FIELD_TYPES = ['text', 'textarea', 'select', 'checkbox', 'date', 'number'] as const;
export type CustomFieldType = (typeof CUSTOM_FIELD_TYPES)[number];

// Shared shape for both the admin's service-config form and, at order-creation
// time, validating a customer's submitted answers against it — see
// orders.service.ts#validateCustomFieldValues.
export class CustomFieldDefDto {
  @IsString() @MaxLength(100)
  key!: string;

  @IsString() @MaxLength(200)
  label!: string;

  @IsIn(CUSTOM_FIELD_TYPES)
  type!: CustomFieldType;

  @IsBoolean()
  required!: boolean;

  @IsOptional() @IsArray() @IsString({ each: true })
  options?: string[];

  @IsOptional() @IsString() @MaxLength(200)
  placeholder?: string;
}
