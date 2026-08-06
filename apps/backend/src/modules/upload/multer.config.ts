import { BadRequestException } from '@nestjs/common';
import type { MulterModuleOptions } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

// Keep uploads in memory (Buffer) so they can be sent straight to R2,
// never written to the local disk.
export const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const imageUploadOptions: MulterModuleOptions = {
  storage: memoryStorage(),
  limits: { fileSize: MAX_IMAGE_FILE_SIZE },
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith('image/')) {
      callback(new BadRequestException('Only image files are allowed'), false);
      return;
    }
    callback(null, true);
  },
};