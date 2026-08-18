import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class CreateSuccessStoryDto {
  @IsString() @MaxLength(100)
  name: string;

  @IsString() @MaxLength(200)
  before_role: string;

  @IsString() @MaxLength(200)
  after_role: string;

  @IsString() @MaxLength(200)
  company: string;

  @IsOptional() @IsString() @MaxLength(50)
  salary_hike?: string;

  @IsString() @MaxLength(5000)
  story: string;

  @IsOptional() @IsString() @MaxLength(5)
  initials?: string;

  @IsOptional() @IsString() @MaxLength(20)
  color?: string;

  @IsOptional() @IsString() @MaxLength(20)
  bg?: string;

  @IsOptional() @IsBoolean()
  published?: boolean;
}
