import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { PromoteBrandDto } from './dto/promote-brand.dto';
import { UploadBrandImageDto, DeleteBrandImageDto } from './dto/upload-image.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ConfigService } from '@nestjs/config';

@Controller('brands')
export class BrandsController {
  constructor(
    private readonly brandsService: BrandsService,
    private readonly configService: ConfigService,
  ) {}

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
  @Roles('admin', 'staff')
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
    return this.brandsService.findBySlug(slug, parsedPage, parsedLimit);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const brand = await this.brandsService.findOne(id);
    return { success: true, brand };
  }

  // Image upload routes - Frontend sends base64, backend processes with R2
  @Post('upload-logo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  async uploadBrandLogo(@Body() uploadDto: UploadBrandImageDto) {
    // This endpoint receives base64 image data from frontend
    // The frontend compresses the image before sending
    // Backend will handle R2 upload here
    
    // For now, return a mock response until R2 integration is implemented
    const r2Key = `brands/logos/${crypto.randomUUID()}.webp`;
    const r2PublicUrl = this.configService.get('R2_PUBLIC_URL', '');
    
    // TODO: Implement actual R2 upload
    // const optimizedBuffer = await this.optimizeImage(dto.fileName);
    // const { url } = await this.uploadToR2(optimizedBuffer, r2Key, 'image/webp');
    
    return {
      success: true,
      file_url: `${r2PublicUrl}/${r2Key}`,
      fileId: r2Key,
      message: 'Image upload endpoint ready - R2 integration pending',
    };
  }

  @Post('delete-logo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  async deleteBrandLogo(@Body() dto: DeleteBrandImageDto) {
    // Guard: only allow deletion of brand logo keys
    if (!dto.fileId.startsWith('brands/logos/')) {
      return { success: false, message: 'Invalid fileId for brand logo' };
    }

    // TODO: Implement actual R2 deletion
    // await this.deleteFromR2(dto.fileId);
    // await this.purgeCdnCache([`${r2PublicUrl}/${dto.fileId}`]);

    return {
      success: true,
      message: 'Brand logo deleted successfully',
    };
  }

  // Admin routes
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  async create(@Body() dto: CreateBrandDto) {
    const brand = await this.brandsService.create(dto);
    return { success: true, brand };
  }

  @Post('promote')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  async promoteBrand(@Body() dto: PromoteBrandDto) {
    return this.brandsService.promote(dto);
  }

  @Post('ignore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  async ignoreBrandName(@Body() dto: PromoteBrandDto) {
    return this.brandsService.ignoreBrandName(dto.brandName);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  async update(@Param('id') id: string, @Body() dto: UpdateBrandDto) {
    const brand = await this.brandsService.update(id, dto);
    return { success: true, brand };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  async remove(@Param('id') id: string) {
    return this.brandsService.remove(id);
  }
}
