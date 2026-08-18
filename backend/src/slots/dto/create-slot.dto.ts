import { IsString, IsOptional, IsBoolean, MaxLength, Matches } from 'class-validator';

export class CreateSlotDto {
  @IsString() @MaxLength(10) @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' })
  date: string;

  @IsString() @MaxLength(5) @Matches(/^\d{2}:\d{2}$/, { message: 'start_time must be HH:MM' })
  start_time: string;

  @IsString() @MaxLength(5) @Matches(/^\d{2}:\d{2}$/, { message: 'end_time must be HH:MM' })
  end_time: string;

  @IsOptional() @IsBoolean()
  is_active?: boolean;
}
