import { IsArray, IsIn, IsString, Length, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class RevBotMessageDto {
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @IsString()
  @Length(1, 4000)
  content: string;
}

export class RevBotChatDto {
  /** Full message history — frontend keeps the conversation in memory and replays it each turn. */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RevBotMessageDto)
  messages: RevBotMessageDto[];
}
