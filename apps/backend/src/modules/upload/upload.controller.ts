import { Body, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { imageUploadOptions, videoUploadOptions } from './multer.config';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('upload-image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @UseInterceptors(FileInterceptor('image', imageUploadOptions))
  uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ) {
    return this.uploadService.uploadImage(file, folder ?? 'general');
  }

  @Post('upload-video')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @UseInterceptors(FileInterceptor('video', videoUploadOptions))
  uploadVideo(@UploadedFile() file: Express.Multer.File) {
    return this.uploadService.uploadVideo(file);
  }

  @Post('delete-image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  deleteImage(@Body() body: { fileId: string }) {
    return this.uploadService.deleteImage(body.fileId);
  }

  @Post('delete-video')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  deleteVideo(@Body() body: { fileId: string }) {
    return this.uploadService.deleteVideo(body.fileId);
  }
}