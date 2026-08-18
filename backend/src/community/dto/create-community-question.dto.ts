import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class CreateCommunityQuestionDto {
  @IsString() @MaxLength(100)
  author_name: string;

  @IsString() @MaxLength(300)
  title: string;

  @IsString() @MaxLength(5000)
  question: string;

  @IsOptional() @IsString() @MaxLength(10000)
  answer?: string;

  @IsOptional() @IsString() @MaxLength(100)
  answered_by?: string;

  @IsOptional() @IsString() @MaxLength(200)
  tags?: string;

  @IsOptional() @IsBoolean()
  solved?: boolean;

  @IsOptional() @IsBoolean()
  published?: boolean;
}
