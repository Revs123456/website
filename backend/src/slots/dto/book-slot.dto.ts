import { IsString, IsEmail, IsOptional, MaxLength } from 'class-validator';

export class BookSlotDto {
  @IsString()
  @MaxLength(200)
  name: string;

  @IsEmail()
  @MaxLength(200)
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(36) // UUID length
  order_id?: string;
}
