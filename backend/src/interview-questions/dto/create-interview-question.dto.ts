import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class CreateInterviewQuestionDto {
  @IsString() @MaxLength(100)
  company: string;

  @IsString() @MaxLength(100)
  role: string;

  @IsString() @MaxLength(5000)
  question: string;

  @IsOptional() @IsString() @MaxLength(10000)
  answer?: string;

  @IsOptional() @IsString() @MaxLength(20)
  difficulty?: string;

  @IsOptional() @IsString() @MaxLength(50)
  category?: string;

  @IsOptional() @IsBoolean()
  published?: boolean;
}
