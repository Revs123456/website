import { IsIn, IsOptional, IsString, MaxLength, IsUUID } from 'class-validator';

const EVENT_TYPES = ['page_view', 'revbot_widget_opened', 'revbot_widget_message'] as const;

export class LogEventDto {
  @IsString() @MaxLength(100)
  session_id: string;

  @IsIn(EVENT_TYPES)
  event_type: (typeof EVENT_TYPES)[number];

  @IsString() @MaxLength(500)
  path: string;

  @IsOptional() @IsIn(['job', 'course', 'roadmap'])
  resource_type?: string;

  @IsOptional() @IsUUID()
  resource_id?: string;
}
