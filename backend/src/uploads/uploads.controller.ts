import {
  BadRequestException, Controller, Get, Param, Post, Res, UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { UploadsService, MAX_UPLOAD_BYTES, ALLOWED_MIME_TYPES } from './uploads.service';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  // Public, throttled — matches the checkout flow's actual auth model:
  // order creation (POST /v1/orders) has no persistent user session either,
  // just per-transaction OTP email verification handled client-side. A file
  // is uploaded before the order exists, so there's nothing to gate this on.
  @Throttle({ default: { ttl: 3600_000, limit: 10 } })
  @Post()
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: MAX_UPLOAD_BYTES },
    fileFilter: (_req, file, cb) => {
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(new BadRequestException(`File type ${file.mimetype} is not allowed.`), false);
        return;
      }
      cb(null, true);
    },
  }))
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided, or the file was rejected (check type/size).');
    return this.uploads.handleUpload(file);
  }

  // Admin-only — the explicit requirement is "admin can view and download",
  // not the customer who uploaded it.
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async download(@Param('id') id: string, @Res() res: Response) {
    const { buffer, fileName, mimeType } = await this.uploads.getFileForDownload(id);
    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      'Content-Length': String(buffer.length),
    });
    res.send(buffer);
  }
}
