import { IsOptional, IsString, Length } from 'class-validator';

/**
 * Text-based roast input. We support PDF uploads via a separate multipart
 * endpoint — DTOs are too painful for binary uploads in NestJS without
 * pulling in @nestjs/platform-express's FileInterceptor and multer types.
 *
 * Min 50 chars prevents people from gaming it with "test" inputs (wastes
 * AI budget). Max 20K chars caps both DB row size and Claude prompt cost.
 */
export class CreateRoastDto {
  @IsString()
  @Length(50, 20000)
  resume_text: string;

  /** Optional referrer for analytics — where the user came from. */
  @IsOptional()
  @IsString()
  @Length(1, 200)
  source?: string;
}
