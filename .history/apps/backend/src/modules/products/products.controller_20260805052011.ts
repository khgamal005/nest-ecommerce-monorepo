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
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ============ PUBLIC ROUTES ============

  // Get filtered products with pagination
  @Get()
  async getFilteredProducts(
    @Query('priceRange') priceRange?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('categories') categories?: string,
    @Query('brands') brands?: string,
    @Query('search') search?: string,
  ) {
    return this.productsService.getFilteredProducts({
      priceRange: priceRange ? priceRange.split(',').map(Number) : undefined,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      categories: categories ? categories.split(',') : undefined,
      brands: brands ? brands.split(',') : undefined,
      search,
    });
  }

  // Search products
  @Get('search')
  async searchProducts(@Query('q') query: string) {
    return this.productsService.searchProducts(query);
  }

  // Get soft-deleted products (admin only)
  @Get('deleted')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  async getDeletedProducts(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.productsService.getDeletedProducts(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  // Get product details by slug
  @Get(':slug')
  async getProductDetails(@Param('slug') slug: string) {
    return this.productsService.getProductDetails(slug);
  }

  // Get product variant options (Amazon/Noon style)
  @Get(':slug/variants')
  async getProductVariantOptions(
    @Param('slug') slug: string,
    @Query('selectedOptions') selectedOptions?: string,
  ) {
    return this.productsService.getProductVariantOptions(
      slug,
      selectedOptions ? JSON.parse(selectedOptions) : undefined,
    );
  }

  // ============ ADMIN ROUTES ============

  // Get all products (admin)
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.productsService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  // Get product by ID (admin)
  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  // Create product
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  async create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  // Update product
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  // Soft delete product
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  async remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  // Restore soft-deleted product
  @Post(':id/restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  async restore(@Param('id') id: string) {
    return this.productsService.restore(id);
  }

  // Hard delete product (admin only)
  @Delete(':id/hard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async hardDelete(@Param('id') id: string) {
    return this.productsService.hardDelete(id);
  }
}
