import { IsOptional, IsString, Length } from 'class-validator';

export class SubmitPlacementDto {
  @IsString()
  @Length(2, 80)
  name: string;

  @IsString()
  @Length(2, 80)
  before_role: string;

  @IsString()
  @Length(2, 80)
  after_role: string;

  @IsString()
  @Length(2, 80)
  company: string;

  /** Free-form — "₹6L → ₹18L" or "200% hike" etc. */
  @IsOptional()
  @IsString()
  @Length(1, 60)
  salary_hike?: string;

  /** User's own words. AI polishes for the public story card. */
  @IsString()
  @Length(20, 1500)
  story: string;
}
