import { IsString } from 'class-validator';

export class DeleteBrandImageDto {
  @IsString()
  fileId: string; // R2 key to delete
}
