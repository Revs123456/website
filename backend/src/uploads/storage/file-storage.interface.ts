// ═══════════════════════════════════════════════════════════════════════════
// Storage abstraction — the rest of the app (UploadsService, OrdersService)
// only ever talks to this interface, never to a concrete storage backend
// directly. Swapping providers later is a one-line change in uploads.module.ts
// (bind FILE_STORAGE_SERVICE to S3FileStorageService instead of
// MockFileStorageService) — nothing else in the codebase changes.
// ═══════════════════════════════════════════════════════════════════════════

export const FILE_STORAGE_SERVICE = Symbol('FILE_STORAGE_SERVICE');

export interface StoredFile {
  /** Backend-specific locator — a relative path today, an S3 object key
   * later. Never exposed to the client; only UploadedFile.id is. */
  storageKey: string;
}

export interface FileStorageService {
  save(buffer: Buffer, fileName: string, mimeType: string): Promise<StoredFile>;
  read(storageKey: string): Promise<Buffer>;
  delete(storageKey: string): Promise<void>;
}
