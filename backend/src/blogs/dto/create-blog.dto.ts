import { IsOptional, IsString, IsBoolean, MaxLength } from 'class-validator';

export class CreateBlogDto {
  @IsOptional() @IsString() @MaxLength(300) title?: string;
  @IsOptional() @IsString() @MaxLength(100) category?: string;
  @IsOptional() @IsString() @MaxLength(200) author?: string;
  @IsOptional() @IsString() @MaxLength(50) read_time?: string;
  @IsOptional() @IsString() @MaxLength(2000) summary?: string;
  @IsOptional() @IsString() @MaxLength(100000) content?: string;
  @IsOptional() @IsString() @MaxLength(500) cover_image?: string;
  @IsOptional() @IsBoolean() published?: boolean;
}
