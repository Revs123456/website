import { IsDateString, IsIn, IsOptional, IsString, IsUUID, Length, MaxLength } from 'class-validator';

const STATUS_VALUES = ['saved', 'applied', 'interview', 'offer', 'rejected'] as const;

export class CreateApplicationDto {
  @IsOptional()
  @IsUUID()
  job_id?: string;

  @IsString()
  @Length(1, 200)
  company: string;

  @IsString()
  @Length(1, 200)
  role: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  job_link?: string;

  @IsOptional()
  @IsIn(STATUS_VALUES)
  status?: (typeof STATUS_VALUES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsDateString()
  applied_at?: string;

  @IsOptional()
  @IsDateString()
  next_follow_up?: string;
}

export class UpdateApplicationDto {
  @IsOptional()
  @IsIn(STATUS_VALUES)
  status?: (typeof STATUS_VALUES)[number];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsDateString()
  applied_at?: string;

  @IsOptional()
  @IsDateString()
  next_follow_up?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  offered_salary?: string;
}
