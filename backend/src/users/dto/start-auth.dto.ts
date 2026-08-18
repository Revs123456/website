import { IsEmail, IsOptional, IsString, Length, MaxLength } from 'class-validator';

/**
 * Step 1 of the OTP-based auth flow.
 * Same endpoint serves both new-user signup and returning-user sign-in —
 * the email's presence in site_users decides which.
 *
 * Name is collected upfront on the signup form so we have it when the user
 * is created on OTP verify (no second "tell us your name" step).
 */
export class StartAuthDto {
  @IsEmail()
  @MaxLength(200)
  email: string;

  @IsOptional()
  @IsString()
  @Length(1, 80)
  name?: string;
}
