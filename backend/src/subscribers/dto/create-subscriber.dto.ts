import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSubscriberDto {
  @IsOptional() @IsEmail() @MaxLength(200)
  email?: string;

  @IsOptional() @IsString() @MaxLength(20)
  whatsapp?: string;

  @IsOptional() @IsString() @MaxLength(20)
  type?: string;
}
