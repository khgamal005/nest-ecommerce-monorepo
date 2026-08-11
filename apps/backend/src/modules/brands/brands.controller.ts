import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { PromoteBrandDto } from './dto/promote-brand.dto';
import { DeleteBrandImageDto } from './dto/upload-image.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { imageUploadOptions } from '../upload/multer.config';
import { deleteFromR2, uploadToR2 } from '../upload/r2-storage';

@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}

  // Public routes
  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('verified') verified?: string,
  ) {
    const verifiedBool = verified === 'true' ? true : verified === 'false' ? false : undefined;
    const brands = await this.brandsService.findAll(search, verifiedBool);
    return { success: true, brands };
  }

  @Get('unverified-names')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getUnverifiedBrandNames() {
    return this.brandsService.getUnverifiedBrandNames();
  }

  @Get('grouped-by-category')
  async getBrandsGroupedByCategory(@Query('categories') categories?: string) {
    const categoryIds = categories ? categories.split(',').filter(Boolean) : undefined;
    const data = await this.brandsService.getBrandsGroupedByCategory(categoryIds);
    return { success: true, data };
  }

  @Get('debug')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async debugBrandData() {
    return this.brandsService.debugBrandData();
  }

  @Get(':slug/products')
  async findBySlug(
    @Param('slug') slug: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedPage = parseInt(page || '1');
    const parsedLimit = parseInt(limit || '12');
    return { success: true, ...(await this.brandsService.findBySlug(slug, parsedPage, parsedLimit)) };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const brand = await this.brandsService.findOne(id);
    return { success: true, brand };
  }

  // Image upload routes - Frontend sends multipart/form-data, backend stores in R2
  @Post('upload-logo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @UseInterceptors(FileInterceptor('image', imageUploadOptions))
  async uploadBrandLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    const extension = extname(file.originalname) || '.webp';
    const r2Key = `brands/logos/${randomUUID()}${extension}`;

    const { url } = await uploadToR2(file.buffer, r2Key, file.mimetype);

    return {
      success: true,
      file_url: url,
      fileId: r2Key,
    };
  }

  @Post('delete-logo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async deleteBrandLogo(@Body() dto: DeleteBrandImageDto) {
    // Guard: only allow deletion of brand logo keys
    if (!dto.fileId.startsWith('brands/logos/')) {
      return { success: false, message: 'Invalid fileId for brand logo' };
    }

    await deleteFromR2(dto.fileId);

    return {
      success: true,
      message: 'Brand logo deleted successfully',
    };
  }

  // Admin routes
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async create(@Body() dto: CreateBrandDto) {
    const brand = await this.brandsService.create(dto);
    return { success: true, brand };
  }

  @Post('promote')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async promoteBrand(@Body() dto: PromoteBrandDto) {
    return this.brandsService.promote(dto);
  }

  @Post('ignore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async ignoreBrandName(@Body() dto: PromoteBrandDto) {
    return this.brandsService.ignoreBrandName(dto.brandName);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async update(@Param('id') id: string, @Body() dto: UpdateBrandDto) {
    const brand = await this.brandsService.update(id, dto);
    return { success: true, brand };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async remove(@Param('id') id: string) {
    return this.brandsService.remove(id);
  }
}
