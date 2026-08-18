import { IsOptional, IsString, IsBoolean, MaxLength } from 'class-validator';
import { IsDateString } from 'class-validator';

export class UpdateSlotDto {
  @IsOptional() @IsDateString() date?: string;
  @IsOptional() @IsString() @MaxLength(10) start_time?: string;
  @IsOptional() @IsString() @MaxLength(10) end_time?: string;
  @IsOptional() @IsBoolean() is_active?: boolean;
  // is_booked, booked_name, booked_email, order_id are managed by book/unbook only
}
