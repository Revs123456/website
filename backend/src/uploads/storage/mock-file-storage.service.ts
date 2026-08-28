import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import * as fsSync from 'fs';
import * as path from 'path';
import { FileStorageService, StoredFile } from './file-storage.interface';

// ═══════════════════════════════════════════════════════════════════════════
// Local-disk storage — active until real cloud storage is set up (no S3
// exists in this project yet; see SERVICES_ARCHITECTURE.md). Writes to
// backend/uploads/ (gitignored). To swap to S3 later: implement
// S3FileStorageService against the same FileStorageService interface, bind
// it in uploads.module.ts instead of this class. Nothing else changes.
// ═══════════════════════════════════════════════════════════════════════════
@Injectable()
export class MockFileStorageService implements FileStorageService {
  private readonly logger = new Logger(MockFileStorageService.name);
  private readonly dir = path.join(process.cwd(), 'uploads');

  constructor() {
    if (!fsSync.existsSync(this.dir)) fsSync.mkdirSync(this.dir, { recursive: true });
  }

  async save(buffer: Buffer, fileName: string, _mimeType: string): Promise<StoredFile> {
    const ext = path.extname(fileName).slice(0, 10); // defensive cap on a weird extension
    const storageKey = `${randomUUID()}${ext}`;
    await fs.writeFile(path.join(this.dir, storageKey), buffer);
    return { storageKey };
  }

  async read(storageKey: string): Promise<Buffer> {
    // storageKey is server-generated (never client input) — but defend
    // against path traversal anyway rather than trust that invariant forever.
    const safe = path.basename(storageKey);
    return fs.readFile(path.join(this.dir, safe));
  }

  async delete(storageKey: string): Promise<void> {
    const safe = path.basename(storageKey);
    try {
      await fs.unlink(path.join(this.dir, safe));
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        this.logger.warn(`Failed to delete mock-stored file ${safe}: ${err.message}`);
      }
    }
  }
}
