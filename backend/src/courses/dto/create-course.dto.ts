import { IsOptional, IsString, IsBoolean, IsNumber, MaxLength } from 'class-validator';
import { IsOptionalUrl } from '../../common/decorators/is-optional-url.decorator';

export class CreateCourseDto {
  @IsOptional() @IsString() @MaxLength(300) title?: string;
  @IsOptional() @IsString() @MaxLength(200) platform?: string;
  @IsOptional() @IsString() @MaxLength(100) category?: string;
  @IsOptional() @IsString() @MaxLength(100) duration?: string;
  @IsOptional() @IsString() @MaxLength(50) level?: string;
  @IsOptional() @IsString() @MaxLength(200) instructor?: string;
  @IsOptional() @IsNumber() rating?: number;
  @IsOptional() @IsString() @MaxLength(100) students?: string;
  @IsOptional() @IsString() @MaxLength(100) price?: string;
  @IsOptional() @IsString() @MaxLength(10000) description?: string;
  @IsOptional() @IsString() @MaxLength(20000) modules?: string;
  @IsOptionalUrl({ protocols: ['https', 'http'], require_tld: true }) @MaxLength(500) course_link?: string;
  @IsOptional() @IsBoolean() published?: boolean;
}
