import { IsString, Length } from 'class-validator';

export class OptimizeResumeDto {
  @IsString()
  @Length(100, 20000)
  resume_text: string;

  @IsString()
  @Length(50, 10000)
  jd_text: string;
}
