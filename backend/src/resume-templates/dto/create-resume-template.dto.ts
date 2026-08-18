import { IsString, IsOptional, IsBoolean, MaxLength, IsUrl } from 'class-validator';

export class CreateResumeTemplateDto {
  @IsString() @MaxLength(200)
  name: string;

  @IsString() @MaxLength(2000)
  description: string;

  @IsOptional() @IsString() @MaxLength(20)
  price?: string;

  @IsOptional() @IsUrl() @MaxLength(500)
  download_link?: string;

  @IsOptional() @IsUrl() @MaxLength(500)
  preview_image?: string;

  @IsOptional() @IsString() @MaxLength(100)
  tag?: string;

  @IsOptional() @IsBoolean()
  is_free?: boolean;

  @IsOptional() @IsBoolean()
  published?: boolean;
}
