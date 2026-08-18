import { IsString, IsOptional, IsBoolean, IsArray, MaxLength } from 'class-validator';

export class CreateRoadmapDto {
  @IsString() @MaxLength(200)
  title: string;

  @IsOptional() @IsString() @MaxLength(1000)
  description?: string;

  @IsOptional() @IsString() @MaxLength(20)
  color?: string;

  @IsOptional() @IsString() @MaxLength(50)
  icon?: string;

  @IsOptional() @IsArray()
  steps?: { s: string; d: string }[];

  @IsOptional() @IsBoolean()
  published?: boolean;
}
