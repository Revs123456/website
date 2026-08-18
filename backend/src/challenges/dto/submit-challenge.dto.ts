import { IsString, Length } from 'class-validator';

export class SubmitChallengeDto {
  /**
   * IST date string (YYYY-MM-DD) — Phase 2 only allows submitting today's
   * challenge, but accepting the date in the URL lets a Phase 4 "catch up
   * via Pro" feature reuse the same endpoint.
   */
  @IsString()
  @Length(10, 10)
  date: string;

  /**
   * The user's written answer. Max 5000 chars is generous for a behavioral
   * STAR-format answer; bigger would suggest copy/paste of a whole essay
   * and isn't valuable for scoring.
   */
  @IsString()
  @Length(10, 5000)
  answer: string;
}
