import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { IsOptionalUrl } from '../../common/decorators/is-optional-url.decorator';

export class CreateResumeTemplateDto {
  @IsString() @MaxLength(200)
  name: string;

  @IsString() @MaxLength(2000)
  description: string;

  @IsOptional() @IsString() @MaxLength(20)
  price?: string;

  @IsOptionalUrl() @MaxLength(500)
  download_link?: string;

  @IsOptionalUrl() @MaxLength(500)
  preview_image?: string;

  @IsOptional() @IsString() @MaxLength(100)
  tag?: string;

  @IsOptional() @IsBoolean()
  is_free?: boolean;

  @IsOptional() @IsBoolean()
  published?: boolean;
}
