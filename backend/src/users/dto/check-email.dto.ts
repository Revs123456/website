import { IsEmail, MaxLength } from 'class-validator';

/**
 * Pre-flight check used by the sign-in/sign-up modal to route the user to
 * the correct step (OTP for an existing account, name-collection for a new
 * one) before an OTP is ever sent.
 *
 * Note: unlike start-auth, this intentionally reveals whether the email is
 * registered — a deliberate product trade-off (branch before OTP) against
 * start-auth's enumeration-safe response shape. Kept as its own endpoint,
 * throttled, rather than folded into start-auth, so that trade-off stays
 * isolated and easy to find.
 */
export class CheckEmailDto {
  @IsEmail()
  @MaxLength(200)
  email: string;
}
