import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { deleteFromR2, uploadToR2 } from './r2-storage';

const ALLOWED_FOLDERS = new Set(['reviews', 'brands', 'products', 'general']);

@Injectable()
export class UploadService {
  async uploadImage(file: Express.Multer.File, folder: string) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    const targetFolder = ALLOWED_FOLDERS.has(folder) ? folder : 'general';
    const extension = extname(file.originalname) || '.webp';
    const fileId = `uploads/admin/${targetFolder}/${randomUUID()}${extension}`;

    const { url } = await uploadToR2(file.buffer, fileId, file.mimetype);

    return { file_url: url, fileId };
  }

  async uploadVideo(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No video file provided');
    }

    if (!file.mimetype.startsWith('video/')) {
      throw new BadRequestException('Only video files are allowed');
    }

    const extension = extname(file.originalname) || '.mp4';
    const fileId = `uploads/admin/videos/${randomUUID()}${extension}`;

    const { url } = await uploadToR2(file.buffer, fileId, file.mimetype);

    return { file_url: url, fileId };
  }

  async deleteImage(fileId: string) {
    if (!fileId) {
      throw new BadRequestException('fileId is required');
    }

    await deleteFromR2(fileId);

    return { success: true, message: 'Image deleted successfully' };
  }

  async deleteVideo(fileId: string) {
    if (!fileId) {
      throw new BadRequestException('fileId is required');
    }

    await deleteFromR2(fileId);

    return { success: true, message: 'Video deleted successfully' };
  }
}