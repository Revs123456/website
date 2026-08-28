import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FILE_STORAGE_SERVICE, FileStorageService } from './storage/file-storage.interface';

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/zip',
];

@Injectable()
export class UploadsService {
  constructor(
    @Inject(FILE_STORAGE_SERVICE) private readonly storage: FileStorageService,
    private readonly prisma: PrismaService,
  ) {}

  async handleUpload(file: Express.Multer.File) {
    const { storageKey } = await this.storage.save(file.buffer, file.originalname, file.mimetype);
    const rec = await this.prisma.uploadedFile.create({
      data: {
        file_name: file.originalname,
        mime_type: file.mimetype,
        file_size: file.size,
        storage_key: storageKey,
      },
    });
    return {
      id: rec.id,
      fileName: rec.file_name,
      mimeType: rec.mime_type,
      size: rec.file_size,
      url: `/v1/uploads/${rec.id}`,
    };
  }

  async getFileForDownload(id: string) {
    const rec = await this.prisma.uploadedFile.findUnique({ where: { id } });
    if (!rec) throw new NotFoundException('File not found');
    const buffer = await this.storage.read(rec.storage_key);
    return { buffer, fileName: rec.file_name, mimeType: rec.mime_type };
  }

  /**
   * Called by OrdersService when creating an order for a service that
   * requires a file upload. Looks the upload up server-side (never trusts
   * client-supplied file metadata) and marks it attached so it can't be
   * reused on a second order.
   */
  async attachToOrder(uploadId: string, orderId: string, label: string | null) {
    const rec = await this.prisma.uploadedFile.findUnique({ where: { id: uploadId } });
    if (!rec) throw new BadRequestException('Uploaded file not found. Please upload again.');
    if (rec.attached_order_id) throw new ConflictException('This upload has already been used on another order. Please upload again.');

    await this.prisma.uploadedFile.update({
      where: { id: uploadId },
      data: { attached_order_id: orderId },
    });

    return this.prisma.orderFile.create({
      data: {
        order_id: orderId,
        file_name: rec.file_name,
        file_url: `/v1/uploads/${rec.id}`,
        mime_type: rec.mime_type,
        file_size: rec.file_size,
        label,
      },
    });
  }
}
