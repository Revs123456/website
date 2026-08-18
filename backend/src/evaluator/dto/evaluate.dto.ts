import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class EvaluateAnswerDto {
  /** Optional FK to InterviewQuestion. Null for free-form questions. */
  @IsOptional()
  @IsUUID()
  question_id?: string;

  @IsString()
  @Length(10, 1000)
  question_text: string;

  @IsString()
  @Length(20, 5000)
  answer: string;
}
