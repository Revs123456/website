import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { MockFileStorageService } from './storage/mock-file-storage.service';
import { FILE_STORAGE_SERVICE } from './storage/file-storage.interface';

@Module({
  controllers: [UploadsController],
  providers: [
    UploadsService,
    // Swap to S3 later by changing only this one binding — nothing else in
    // the app (UploadsService, OrdersService, the frontend) references
    // MockFileStorageService directly, only the FileStorageService interface.
    { provide: FILE_STORAGE_SERVICE, useClass: MockFileStorageService },
  ],
  exports: [UploadsService],
})
export class UploadsModule {}
