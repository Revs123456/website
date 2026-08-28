import { IsIn, IsOptional, IsDateString, IsInt, Min, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

const RANGE_KEYS = ['today', 'yesterday', 'last7', 'last30', 'last90', 'this_month', 'last_month', 'custom'] as const;

export class AnalyticsRangeDto {
  @IsOptional() @IsIn(RANGE_KEYS)
  range: (typeof RANGE_KEYS)[number] = 'last30';

  @IsOptional() @IsDateString()
  start?: string;

  @IsOptional() @IsDateString()
  end?: string;
}

export class AnalyticsUsersTableDto extends AnalyticsRangeDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page: number = 1;

  @IsOptional() @IsString() @MaxLength(200)
  search?: string;

  @IsOptional() @IsIn(['created_at', 'last_active', 'sessions', 'session_time'])
  sort: 'created_at' | 'last_active' | 'sessions' | 'session_time' = 'created_at';
}
