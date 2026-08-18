import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreateSalaryInsightDto {
  @IsString() @MaxLength(200)
  role: string;

  @IsString() @MaxLength(100)
  city: string;

  @IsString() @MaxLength(50)
  experience_level: string;

  @IsString() @MaxLength(50)
  min_salary: string;

  @IsString() @MaxLength(50)
  max_salary: string;

  @IsOptional() @IsString() @MaxLength(50)
  avg_salary?: string;

  @IsOptional() @IsString() @MaxLength(500)
  companies?: string;
}
