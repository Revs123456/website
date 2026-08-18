import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class CreateDailyTipDto {
  @IsString() @MaxLength(2000)
  tip: string;

  @IsOptional() @IsString() @MaxLength(50)
  category?: string;

  @IsOptional() @IsBoolean()
  active?: boolean;
}
