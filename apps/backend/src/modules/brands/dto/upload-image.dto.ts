import { IsString } from 'class-validator';

export class UploadBrandImageDto {
  @IsString()
  fileName: string; // Base64 encoded image
}

export class DeleteBrandImageDto {
  @IsString()
  fileId: string; // R2 key to delete
}
