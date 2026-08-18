import { IsString, IsOptional, IsBoolean, IsInt, Min, Max, MaxLength } from 'class-validator';

export class CreateTestimonialDto {
  @IsString() @MaxLength(100)
  name: string;

  @IsString() @MaxLength(200)
  role: string;

  @IsString() @MaxLength(2000)
  quote: string;

  @IsOptional() @IsString() @MaxLength(5)
  initials?: string;

  @IsOptional() @IsString() @MaxLength(20)
  color?: string;

  @IsOptional() @IsString() @MaxLength(20)
  bg?: string;

  @IsOptional() @IsString() @MaxLength(100)
  package?: string;

  @IsOptional() @IsInt() @Min(1) @Max(5)
  rating?: number;

  @IsOptional() @IsBoolean()
  published?: boolean;
}
