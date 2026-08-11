import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductOption } from './entities/product-option.entity';
import { Image } from './entities/image.entity';
import { ProductVideo } from './entities/product-video.entity';
import { Category } from '../categories/entities/category.entity';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { ProductStatus } from './entities/product-status.enum';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly dataSource: DataSource,
  ) {}

  private readonly productRelations = [
    'images',
    'videos',
    'brand',
    'category',
    'category.parent',
    'category.parent.parent',
    'options',
    'options.values',
    'variants',
    'variants.images',
    'variants.videos',
    'variants.optionValues',
    'variants.optionValues.optionValue',
    'variants.optionValues.optionValue.option',
  ];

  // Get filtered products with pagination
  async getFilteredProducts(filters: {
    priceRange?: number[];
    page?: number;
    limit?: number;
    categories?: string[];
    brands?: string[];
    search?: string;
  }) {
    const {
      priceRange = [0, 10000],
      page = 1,
      limit = 12,
      categories = [],
      brands = [],
      search,
    } = filters;

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.variants', 'variants', 'variants.isActive = :isActive', { isActive: true })
      .where('product.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('product.status = :status', { status: ProductStatus.ACTIVE });

    // Price filter on variants
    if (priceRange && priceRange.length === 2) {
      queryBuilder.andWhere(
        '(variants.salePrice BETWEEN :minPrice AND :maxPrice OR variants.price BETWEEN :minPrice AND :maxPrice)',
        { minPrice: priceRange[0], maxPrice: priceRange[1] }
      );
    }

    // Category filter
    if (categories && categories.length > 0) {
      queryBuilder.andWhere(
        '(product.categoryLevel1Id IN (:...cats) OR product.categoryLevel2Id IN (:...cats) OR product.categoryLevel3Id IN (:...cats))',
        { cats: categories }
      );
    }

    // Brand filter
    if (brands && brands.length > 0) {
      queryBuilder.andWhere('product.brandId IN (:...brands)', { brands });
    }

    // Search
    if (search) {
      queryBuilder.andWhere(
        '(product.title ILIKE :search OR product.short_description ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);
    queryBuilder.orderBy('product.createdAt', 'DESC');

    const [products, total] = await queryBuilder.getManyAndCount();

    return {
      success: true,
      products: products.map((p) => this.enrichProduct(p)),
      pagination: {
        total,
        limit,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get product by slug with full details
  async getProductDetails(slug: string) {
    const product = await this.productRepository.findOne({
      where: { slug },
      relations: this.productRelations,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return {
      success: true,
      product: this.enrichProduct(product),
    };
  }

  async getProductDetailsById(id: string) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: this.productRelations,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return {
      success: true,
      product: this.enrichProduct(product),
    };
  }

  // Get variant options (Amazon/Noon style)
  async getProductVariantOptions(slug: string, selectedOptions?: Record<string, string>) {
    const product = await this.productRepository.findOne({
      where: { slug },
      relations: [
        'images',
        'options',
        'options.values',
        'variants',
        'variants.images',
        'variants.optionValues',
        'variants.optionValues.optionValue',
        'variants.optionValues.optionValue.option',
      ],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!product.hasVariants || !product.variants?.length) {
      return {
        success: true,
        product: {
          ...product,
          defaultVariant: null,
          availableOptions: {},
          matchingVariants: [],
        },
      };
    }

    // Filter variants based on selected options
    let matchingVariants = product.variants.filter((variant: any) => {
      if (!selectedOptions || Object.keys(selectedOptions).length === 0) return true;
      return Object.entries(selectedOptions).every(([optionName, optionValue]) => {
        return variant.optionValues?.some(
          (ov: any) =>
            ov.optionValue?.option?.name === optionName &&
            ov.optionValue?.value === optionValue
        );
      });
    });

    // Calculate available options
    const availableOptions: Record<string, Set<string>> = {};
    product.options?.forEach((option: any) => {
      availableOptions[option.name] = new Set();
    });

    matchingVariants.forEach((variant: any) => {
      variant.optionValues?.forEach((ov: any) => {
        const optionName = ov.optionValue?.option?.name;
        const optionValue = ov.optionValue?.value;
        if (optionName && optionValue && availableOptions[optionName]) {
          availableOptions[optionName].add(optionValue);
        }
      });
    });

    // Convert Sets to Arrays
    const availableOptionsArray: Record<string, string[]> = {};
    Object.entries(availableOptions).forEach(([key, valueSet]) => {
      availableOptionsArray[key] = Array.from(valueSet);
    });

    const defaultVariant =
      matchingVariants.find((v: any) => v.stock > 0) || matchingVariants[0] || null;

    return {
      success: true,
      product: {
        id: product.id,
        title: product.title,
        slug: product.slug,
        short_description: product.short_description,
        detailed_description: product.detailed_description,
        brand: product.brand,
        hasVariants: product.hasVariants,
        images: defaultVariant?.images?.length ? defaultVariant.images : product.images,
        options: product.options,
        variants: matchingVariants.map((v: any) => ({
          id: v.id,
          sku: v.sku,
          price: v.price,
          salePrice: v.salePrice,
          stock: v.stock,
          isActive: v.isActive,
          images: v.images,
          optionValues: v.optionValues?.map((ov: any) => ({
            name: ov.optionValue?.option?.name,
            value: ov.optionValue?.value,
          })),
        })),
        defaultVariant: defaultVariant
          ? {
              id: defaultVariant.id,
              sku: defaultVariant.sku,
              price: defaultVariant.price,
              salePrice: defaultVariant.salePrice,
              stock: defaultVariant.stock,
              images: defaultVariant.images,
              optionValues: defaultVariant.optionValues?.map((ov: any) => ({
                name: ov.optionValue?.option?.name,
                value: ov.optionValue?.value,
              })),
            }
          : null,
        availableOptions: availableOptionsArray,
        matchingVariants: matchingVariants.length,
      },
    };
  }

  // Create product with variants
  async create(dto: CreateProductDto) {
    // Check slug uniqueness
    const existingSlug = await this.productRepository.findOne({
      where: { slug: dto.slug },
    });
    if (existingSlug) {
      throw new ConflictException('Product slug already exists');
    }

    // Get category and build path
    const category = await this.categoryRepository.findOne({
      where: { id: dto.categoryId },
      relations: ['parent', 'parent.parent'],
    });

    if (!category) {
      throw new BadRequestException('Invalid category');
    }

    let categoryLevel1Id: string | null = null;
    let categoryLevel2Id: string | null = null;
    let categoryLevel3Id: string | null = null;
    let categoryPath = '';

    if (category.level === 3) {
      categoryLevel3Id = category.id;
      categoryLevel2Id = category.parent?.id || null;
      categoryLevel1Id = category.parent?.parent?.id || null;
    } else if (category.level === 2) {
      categoryLevel2Id = category.id;
      categoryLevel1Id = category.parent?.id || null;
    } else if (category.level === 1) {
      categoryLevel1Id = category.id;
    }

    // Build category path
    const pathParts: string[] = [];
    if (categoryLevel1Id) {
      const cat1 = category.parent?.parent || category.parent || category;
      pathParts.push(cat1.slug);
    }
    if (categoryLevel2Id && category.parent) {
      pathParts.push(category.parent.slug);
    }
    if (categoryLevel3Id) {
      pathParts.push(category.slug);
    }
    categoryPath = pathParts.length > 0 ? `/${pathParts.join('/')}/` : '';

    const createdProductId = await this.dataSource.transaction(async (manager) => {
      // Create product
      const product = manager.create(Product, {
        title: dto.title,
        slug: dto.slug,
        short_description: dto.short_description,
        detailed_description: dto.detailed_description,
        categoryId: dto.categoryId,
        categoryLevel1Id,
        categoryLevel2Id,
        categoryLevel3Id,
        categoryPath,
        brandId: dto.brandId || null,
        brandName: dto.brandId ? null : dto.brandName || null,
        warranty: dto.warranty || null,
        cashOnDelivery: dto.cashOnDelivery || null,
        tags: dto.tags || [],
        hasVariants: dto.hasVariants || false,
        isReturnable: dto.isReturnable !== false,
        custom_specifications: dto.custom_specifications || null,
        status: ProductStatus.ACTIVE, // Auto-approve for single vendor
      });

      const savedProduct = await manager.save(product);

      // Create images
      if (dto.images && dto.images.length > 0) {
        for (const img of dto.images) {
          const image = manager.create(Image, {
            productId: savedProduct.id,
            url: img.file_Url,
            r2_key: img.fileId || null,
          });
          await manager.save(image);
        }
      }

      // Create videos
      if (dto.videos && dto.videos.length > 0) {
        for (const vid of dto.videos) {
          const video = manager.create(ProductVideo, {
            productId: savedProduct.id,
            url: vid.url,
            r2_key: vid.fileId || null,
            mime_type: vid.mime_type || 'video/mp4',
            size_bytes: vid.size_bytes || null,
          });
          await manager.save(video);
        }
      }

      // Create options and variants
      if (dto.hasVariants && dto.options && dto.variants) {
        const optionMap = new Map<string, Map<string, string>>();

        // Create options
        for (const opt of dto.options) {
          const option = manager.create(ProductOption, {
            productId: savedProduct.id,
            name: opt.name,
            required: opt.required ?? true,
          });
          const savedOption = await manager.save(option);

          const valueMap = new Map<string, string>();
          for (const val of opt.values) {
            // Create option value (using raw query since we don't have entity)
            const optionValueResult = await manager.query(
              `INSERT INTO product_option_values ("optionId", value) VALUES ($1, $2) RETURNING id`,
              [savedOption.id, val.value]
            );
            valueMap.set(val.value, optionValueResult[0].id);
          }
          optionMap.set(opt.name, valueMap);
        }

        // Create variants
        for (const variant of dto.variants) {
          const v = manager.create(ProductVariant, {
            productId: savedProduct.id,
            sku: variant.sku,
            price: variant.price.toString(),
            salePrice: variant.salePrice?.toString() || null,
            stock: variant.stock,
            isActive: variant.isActive ?? true,
            starting_date: variant.starting_date ? new Date(variant.starting_date) : null,
            ending_date: variant.ending_date ? new Date(variant.ending_date) : null,
          });
          const savedVariant = await manager.save(v);

          // Create variant images
          if (variant.images && variant.images.length > 0) {
            for (const img of variant.images) {
              const image = manager.create(Image, {
                productId: savedProduct.id,
                productVariantId: savedVariant.id,
                url: img.file_Url,
                r2_key: img.fileId || null,
              });
              await manager.save(image);
            }
          }

          // Create variant option values
          if (variant.optionValues) {
            for (const [optionName, optionValue] of Object.entries(variant.optionValues)) {
              const valueMap = optionMap.get(optionName);
              if (valueMap) {
                const optionValueId = valueMap.get(optionValue as string);
                if (optionValueId) {
                  await manager.query(
                    `INSERT INTO variant_option_values ("variantId", "optionValueId") VALUES ($1, $2)`,
                    [savedVariant.id, optionValueId]
                  );
                }
              }
            }
          }
        }
      } else {
        // Create default variant for simple product
        const defaultSku = `${dto.slug.replace(/-/g, '')}-default`;
        const variant = manager.create(ProductVariant, {
          productId: savedProduct.id,
          sku: defaultSku,
          price: (dto.regular_price || 0).toString(),
          salePrice: dto.sale_price?.toString() || null,
          stock: dto.stock || 0,
          isActive: true,
          starting_date: dto.starting_date ? new Date(dto.starting_date) : null,
          ending_date: dto.ending_date ? new Date(dto.ending_date) : null,
        });
        await manager.save(variant);
      }

      return savedProduct.id;
    });

    return this.getProductDetailsById(createdProductId);
  }

  // Update product
  async update(id: string, dto: UpdateProductDto) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check slug uniqueness if changing
    if (dto.slug && dto.slug !== product.slug) {
      const existingSlug = await this.productRepository.findOne({
        where: { slug: dto.slug },
      });
      if (existingSlug) {
        throw new ConflictException('Product slug already exists');
      }
    }

    // Get category if changing
    let categoryData: any = null;
    if (dto.categoryId && dto.categoryId !== product.categoryId) {
      categoryData = await this.categoryRepository.findOne({
        where: { id: dto.categoryId },
        relations: ['parent', 'parent.parent'],
      });
      if (!categoryData) {
        throw new BadRequestException('Invalid category');
      }
    }

    await this.dataSource.transaction(async (manager) => {
      // Update product fields
      const updateData: Partial<Product> = {
        title: dto.title || product.title,
        slug: dto.slug || product.slug,
        short_description: dto.short_description || product.short_description,
        detailed_description: dto.detailed_description || product.detailed_description,
        brandId: dto.brandId !== undefined ? dto.brandId : product.brandId,
        brandName: dto.brandId ? null : dto.brandName || product.brandName,
        warranty: dto.warranty !== undefined ? dto.warranty : product.warranty,
        cashOnDelivery: dto.cashOnDelivery !== undefined ? dto.cashOnDelivery : product.cashOnDelivery,
        tags: dto.tags || product.tags,
        hasVariants: dto.hasVariants !== undefined ? dto.hasVariants : product.hasVariants,
        isReturnable: dto.isReturnable !== undefined ? dto.isReturnable : product.isReturnable,
        custom_specifications: dto.custom_specifications !== undefined ? dto.custom_specifications : product.custom_specifications,
      };

      if (categoryData) {
        updateData.categoryId = dto.categoryId;
        if (categoryData.level === 3) {
          updateData.categoryLevel3Id = categoryData.id;
          updateData.categoryLevel2Id = categoryData.parent?.id || null;
          updateData.categoryLevel1Id = categoryData.parent?.parent?.id || null;
        } else if (categoryData.level === 2) {
          updateData.categoryLevel2Id = categoryData.id;
          updateData.categoryLevel1Id = categoryData.parent?.id || null;
        } else if (categoryData.level === 1) {
          updateData.categoryLevel1Id = categoryData.id;
        }
      }

      await manager.update(Product, id, updateData);

      // Delete and recreate images, videos, options, variants
      await manager.query(`DELETE FROM images WHERE "productId" = $1`, [id]);
      await manager.query(`DELETE FROM product_videos WHERE "productId" = $1`, [id]);
      await manager.query(`DELETE FROM variant_option_values WHERE "variantId" IN (SELECT id FROM product_variants WHERE "productId" = $1)`, [id]);
      await manager.query(`DELETE FROM product_option_values WHERE "optionId" IN (SELECT id FROM product_options WHERE "productId" = $1)`, [id]);
      await manager.query(`DELETE FROM product_options WHERE "productId" = $1`, [id]);
      await manager.query(`DELETE FROM product_variants WHERE "productId" = $1`, [id]);

      // Recreate images
      if (dto.images && dto.images.length > 0) {
        for (const img of dto.images) {
          await manager.query(
            `INSERT INTO images ("productId", url, r2_key) VALUES ($1, $2, $3)`,
            [id, img.file_Url, img.fileId || null]
          );
        }
      }

      // Recreate videos
      if (dto.videos && dto.videos.length > 0) {
        for (const vid of dto.videos) {
          await manager.query(
            `INSERT INTO product_videos ("productId", url, r2_key, mime_type, size_bytes) VALUES ($1, $2, $3, $4, $5)`,
            [id, vid.url, vid.fileId || null, vid.mime_type || 'video/mp4', vid.size_bytes || null]
          );
        }
      }

      // Recreate options and variants
      if (dto.hasVariants && dto.options && dto.variants) {
        const optionMap = new Map<string, Map<string, string>>();

        for (const opt of dto.options) {
          const optionResult = await manager.query(
            `INSERT INTO product_options ("productId", name, required) VALUES ($1, $2, $3) RETURNING id`,
            [id, opt.name, opt.required ?? true]
          );
          const optionId = optionResult[0].id;

          const valueMap = new Map<string, string>();
          for (const val of opt.values) {
            const valueResult = await manager.query(
              `INSERT INTO product_option_values ("optionId", value) VALUES ($1, $2) RETURNING id`,
              [optionId, val.value]
            );
            valueMap.set(val.value, valueResult[0].id);
          }
          optionMap.set(opt.name, valueMap);
        }

        for (const variant of dto.variants) {
          const variantResult = await manager.query(
            `INSERT INTO product_variants ("productId", sku, price, "salePrice", stock, "isActive", starting_date, ending_date) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
            [
              id,
              variant.sku,
              variant.price.toString(),
              variant.salePrice?.toString() || null,
              variant.stock,
              variant.isActive ?? true,
              variant.starting_date || null,
              variant.ending_date || null,
            ]
          );
          const variantId = variantResult[0].id;

          if (variant.images && variant.images.length > 0) {
            for (const img of variant.images) {
              await manager.query(
                `INSERT INTO images ("productId", "productVariantId", url, r2_key) VALUES ($1, $2, $3, $4)`,
                [id, variantId, img.file_Url, img.fileId || null]
              );
            }
          }

          if (variant.optionValues) {
            for (const [optionName, optionValue] of Object.entries(variant.optionValues)) {
              const valueMap = optionMap.get(optionName);
              if (valueMap) {
                const optionValueId = valueMap.get(optionValue as string);
                if (optionValueId) {
                  await manager.query(
                    `INSERT INTO variant_option_values ("variantId", "optionValueId") VALUES ($1, $2)`,
                    [variantId, optionValueId]
                  );
                }
              }
            }
          }
        }
      } else {
        // Create default variant for simple product
        const defaultSku = `${(dto.slug || product.slug).replace(/-/g, '')}-default`;
        await manager.query(
          `INSERT INTO product_variants ("productId", sku, price, "salePrice", stock, "isActive", starting_date, ending_date) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            id,
            defaultSku,
            (dto.regular_price || 0).toString(),
            dto.sale_price?.toString() || null,
            dto.stock || 0,
            true,
            dto.starting_date || null,
            dto.ending_date || null,
          ]
        );
      }

      return id;
    });

    return this.getProductDetailsById(id);
  }

  // Soft delete product
  async remove(id: string) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.productRepository.update(id, {
      isDeleted: true,
      deletedAt: new Date(),
    });

    return { success: true, message: 'Product deleted successfully' };
  }

  // Restore soft-deleted product
  async restore(id: string) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!product.isDeleted) {
      throw new BadRequestException('Product is not deleted');
    }

    await this.productRepository.update(id, {
      isDeleted: false,
      deletedAt: null,
    });

    return { success: true, message: 'Product restored successfully' };
  }

  // Hard delete product
  async hardDelete(id: string) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['images', 'videos', 'variants', 'variants.images'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (!product.isDeleted) {
      throw new BadRequestException('Product must be soft-deleted first');
    }

    await this.productRepository.remove(product);

    return { success: true, message: 'Product permanently deleted' };
  }

  // Get soft-deleted products
  async getDeletedProducts(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [products, total] = await this.productRepository.findAndCount({
      where: { isDeleted: true },
      relations: ['images', 'variants'],
      skip,
      take: limit,
      order: { deletedAt: 'DESC' },
    });

    return {
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Search products
  async searchProducts(query: string) {
    if (!query || query.trim().length < 2) {
      throw new BadRequestException('Search query must be at least 2 characters');
    }

    const products = await this.productRepository
      .createQueryBuilder('product')
      .where('product.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('product.status = :status', { status: ProductStatus.ACTIVE })
      .andWhere(
        '(product.title ILIKE :query OR product.short_description ILIKE :query)',
        { query: `%${query}%` }
      )
      .select(['product.id', 'product.title', 'product.slug'])
      .orderBy('product.createdAt', 'DESC')
      .take(10)
      .getMany();

    return { success: true, products };
  }

  // Helper: Enrich product with default variant data
  private enrichProduct(product: Product) {
    const defaultVariant =
      product.variants?.find((v: any) => v.isActive) || product.variants?.[0];

    return {
      ...product,
      regular_price: defaultVariant?.price || 0,
      sale_price: defaultVariant?.salePrice || 0,
      stock: defaultVariant?.stock || 0,
    };
  }

  // Get product by ID (for admin)
  async findOne(id: string) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: [
        'images',
        'videos',
        'brand',
        'category',
        'options',
        'options.values',
        'variants',
        'variants.images',
        'variants.optionValues',
        'variants.optionValues.optionValue',
        'variants.optionValues.optionValue.option',
      ],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.enrichProduct(product);
  }

  // Get all products (admin)
  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [products, total] = await this.productRepository.findAndCount({
      where: { isDeleted: false },
      relations: ['images', 'brand', 'category', 'variants'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      success: true,
      products: products.map((p) => this.enrichProduct(p)),
      pagination: {
        total,
        limit,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
