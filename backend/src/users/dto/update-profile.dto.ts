import { IsBoolean, IsOptional, IsString, IsUrl, Length, Matches, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(1, 80)
  name?: string;

  // Username — lowercase letters/numbers/underscore, 3-30 chars.
  // Used for Phase 3 public profile URLs (/u/<username>).
  @IsOptional()
  @IsString()
  @Length(3, 30)
  @Matches(/^[a-z0-9_]+$/, { message: 'username may only contain lowercase letters, numbers, and underscores' })
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  experience?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  target_role?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  current_role?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(300)
  avatar_url?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(300)
  github_url?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(300)
  linkedin_url?: string;

  @IsOptional()
  @IsBoolean()
  email_opt_in?: boolean;

  // Phase 3 — explicit opt-in to expose /u/<username> publicly.
  // Username must also be set; the public-profile endpoint enforces that.
  @IsOptional()
  @IsBoolean()
  profile_public?: boolean;
}
