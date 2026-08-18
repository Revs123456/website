import {
  BadRequestException, Body, Controller, Get, HttpCode, Param, Post,
  Req, UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');
import { RoastService } from './roast.service';
import { CreateRoastDto } from './dto/create-roast.dto';
import { clientIp } from '../viral.util';

/**
 * Two endpoints because two upload paths:
 *   POST /roasts        — text body (faster, no parsing overhead)
 *   POST /roasts/pdf    — multipart PDF (we parse server-side)
 *
 * Both intentionally accept anonymous users. The optional JWT cookie is
 * read manually (not via UserJwtAuthGuard which would reject anonymous).
 */
@Controller('roasts')
export class RoastController {
  constructor(private readonly svc: RoastService) {}

  // Tight throttle since each call costs real money. Limit per IP, not per
  // user — viral abuse vectors are IP-based (no-account farming).
  @Post()
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 2 } })
  async createFromText(@Body() dto: CreateRoastDto, @Req() req: Request) {
    const userId = this.extractOptionalUserId(req);
    return this.svc.createRoast({
      resumeText: dto.resume_text,
      userId,
      ip: clientIp(req),
    });
  }

  @Post('pdf')
  @HttpCode(200)
  @Throttle({ default: { ttl: 60_000, limit: 2 } })
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB cap — far more than any real resume
  }))
  async createFromPdf(@UploadedFile() file: Express.Multer.File | undefined, @Req() req: Request) {
    if (!file) throw new BadRequestException('No PDF file uploaded.');
    if (!file.mimetype.includes('pdf')) throw new BadRequestException('Only PDF files are accepted.');

    let text = '';
    try {
      const parsed = await pdfParse(file.buffer);
      text = (parsed.text || '').trim();
    } catch {
      throw new BadRequestException('Could not read this PDF. Try copying the text and using the text endpoint.');
    }
    if (!text || text.length < 50) {
      throw new BadRequestException('The PDF appears to be empty or image-based (no extractable text).');
    }

    const userId = this.extractOptionalUserId(req);
    return this.svc.createRoast({
      resumeText: text,
      userId,
      ip: clientIp(req),
    });
  }

  // Public read — share token is the bearer of authorization
  @Get(':token')
  get(@Param('token') token: string) {
    return this.svc.getByToken(token);
  }

  /**
   * Read the user JWT cookie WITHOUT enforcing it.
   * UserJwtAuthGuard would 401 anonymous visitors — we don't want that here.
   */
  private extractOptionalUserId(req: Request): string | null {
    try {
      const cookieToken = (req as any).cookies?.tch_user_token;
      if (!cookieToken) return null;
      // Avoid pulling in jsonwebtoken here — keep this controller dep-light.
      // Decode without verify is fine since we treat the userId as an
      // attribution hint, not authorization. Any tampering only links the
      // roast to the wrong user (no escalation).
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const jwt = require('jsonwebtoken');
      const payload = jwt.verify(cookieToken, process.env.JWT_SECRET || '');
      return payload?.role === 'user' ? payload.sub : null;
    } catch {
      return null;
    }
  }
}
