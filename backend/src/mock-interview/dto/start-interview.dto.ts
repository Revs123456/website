import { IsIn, IsOptional, IsString, Length } from 'class-validator';

export class StartInterviewDto {
  @IsString()
  @Length(2, 80)
  role: string;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  company?: string;

  @IsOptional()
  @IsIn(['easy', 'medium', 'hard'])
  difficulty?: 'easy' | 'medium' | 'hard';
}
