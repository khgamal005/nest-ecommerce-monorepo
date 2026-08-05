import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Brand } from './entities/brand.entity';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { PromoteBrandDto } from './dto/promote-brand.dto';
import * as slugify from 'slugify';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateBrandDto) {
    const slug = slugify(dto.name, { lower: true, strict: true });
    
    const existing = await this.brandRepository.findOne({ where: { slug } });
    if (existing) {
      throw new ConflictException('Brand already exists');
    }

    const brand = this.brandRepository.create({
      name: dto.name.trim(),
      slug,
      logo: dto.logo?.trim() || null,
      logoR2Key: dto.logoR2Key?.trim() || null,
      verified: dto.verified !== false,
    });

    return this.brandRepository.save(brand);
  }

  async findAll(search?: string, verified?: boolean) {
    const queryBuilder = this.brandRepository.createQueryBuilder('brand');

    if (verified !== undefined) {
      queryBuilder.andWhere('brand.verified = :verified', { verified });
    }

    if (search) {
      queryBuilder.andWhere('brand.name ILIKE :search', { search: `%${search}%` });
    }

    queryBuilder.orderBy('brand.name', 'ASC');

    return queryBuilder.getMany();
  }

  async findOne(id: string) {
    const brand = await this.brandRepository.findOne({ where: { id } });
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }
    return brand;
  }

  async findBySlug(slug: string, page: number = 1, limit: number = 12) {
    const brand = await this.brandRepository.findOne({ where: { slug } });

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    // Get products for this brand with pagination
    const offset = (page - 1) * limit;
    const products = await this.dataSource.query(
      `
      SELECT 
        p.*,
        CASE WHEN EXISTS (SELECT 1 FROM product_variants pv WHERE pv."productId" = p.id AND pv."isActive" = true)
          THEN true
          ELSE false
        END as "hasVariants"
      FROM products p
      WHERE p."brandId" = $1
        AND p.status = 'active'
        AND p."isDeleted" = false
      ORDER BY p."createdAt" DESC
      LIMIT $2 OFFSET $3
      `,
      [brand.id, limit, offset]
    );

    const totalResult = await this.dataSource.query(
      `
      SELECT COUNT(*) as count
      FROM products p
      WHERE p."brandId" = $1
        AND p.status = 'active'
        AND p."isDeleted" = false
      `,
      [brand.id]
    );

    const total = parseInt(totalResult[0]?.count || '0');
    const totalPages = Math.ceil(total / limit);

    return {
      brand,
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async getBrandsGroupedByCategory(categoryIds?: string[]) {
    // Using raw query for aggregation
    let categoryFilter = '';
    const params: any[] = [];
    
    if (categoryIds && categoryIds.length > 0) {
      categoryFilter = `
        AND (p."categoryLevel1Id" IN (${categoryIds.map((_, i) => `$${i + 1}`).join(',')})
          OR p."categoryLevel2Id" IN (${categoryIds.map((_, i) => `$${i + 1}`).join(',')})
          OR p."categoryLevel3Id" IN (${categoryIds.map((_, i) => `$${i + 1}`).join(',')}))
      `;
      params.push(...categoryIds);
    }

    const query = `
      SELECT 
        COALESCE(c.name, 'Others') as "categoryName",
        COALESCE(c.slug, 'others') as "categorySlug",
        json_agg(
          json_build_object(
            'id', b.id,
            'name', b.name,
            'slug', b.slug,
            'logo', b.logo,
            'verified', b.verified,
            'count', p_count.count
          )
        ) as brands
      FROM (
        SELECT 
          p."brandId",
          COALESCE(p."categoryLevel1Id", p."categoryId") as "categoryId",
          COUNT(*) as count
        FROM products p
        WHERE p.status = 'active'
          AND p."isDeleted" = false
          AND p."brandId" IS NOT NULL
          ${categoryFilter}
        GROUP BY p."brandId", COALESCE(p."categoryLevel1Id", p."categoryId")
      ) p_count
      JOIN brands b ON b.id = p_count."brandId"
      LEFT JOIN categories c ON c.id = p_count."categoryId"
      GROUP BY COALESCE(c.name, 'Others'), COALESCE(c.slug, 'others')
      ORDER BY "categoryName" ASC
    `;

    return this.dataSource.query(query, params);
  }

  async update(id: string, dto: UpdateBrandDto) {
    const brand = await this.findOne(id);
    const updateData: Partial<Brand> = {};

    if (dto.name !== undefined) {
      updateData.name = dto.name.trim();
      updateData.slug = slugify(dto.name, { lower: true, strict: true });
    }

    if (dto.logo !== undefined) {
      updateData.logo = dto.logo?.trim() || null;
    }

    if (dto.logoR2Key !== undefined) {
      updateData.logoR2Key = dto.logoR2Key?.trim() || null;
    }

    if (dto.verified !== undefined) {
      updateData.verified = dto.verified === true || dto.verified === 'true';
    }

    Object.assign(brand, updateData);
    return this.brandRepository.save(brand);
  }

  async remove(id: string) {
    const brand = await this.findOne(id);

    // Remove brand reference from products
    await this.dataSource.query(
      `UPDATE products SET "brandId" = NULL WHERE "brandId" = $1`,
      [id]
    );

    await this.brandRepository.remove(brand);
    return { message: 'Brand deleted successfully' };
  }

  async promote(dto: PromoteBrandDto) {
    const slug = slugify(dto.brandName, { lower: true, strict: true });

    await this.dataSource.transaction(async (manager) => {
      let brand = await manager.findOne(Brand, { where: { slug } });

      if (!brand) {
        brand = manager.create(Brand, {
          name: dto.brandName.trim(),
          slug,
          verified: true,
        });
        await manager.save(brand);
      } else if (!brand.verified) {
        brand.verified = true;
        await manager.save(brand);
      }

      // Update products with this brandName to use brandId
      await manager.query(
        `
        UPDATE products 
        SET "brandId" = $1, "brandName" = NULL
        WHERE LOWER("brandName") = LOWER($2)
          AND "brandId" IS NULL
        `,
        [brand.id, dto.brandName.trim()]
      );
    });

    return { message: `"${dto.brandName}" promoted and backfilled` };
  }

  async getUnverifiedBrandNames() {
    const unverifiedBrands = await this.brandRepository.find({
      where: { verified: false },
      select: ['id', 'name'],
    });

    const productsWithoutBrandId = await this.dataSource.query(`
      SELECT "brandName", COUNT(*) as count
      FROM products
      WHERE "brandName" IS NOT NULL
        AND "brandName" != ''
        AND "brandName" != ' '
        AND "brandId" IS NULL
        AND "isDeleted" = false
      GROUP BY "brandName"
    `);

    const brandMap = new Map<string, number>();

    unverifiedBrands.forEach((brand) => {
      const name = brand.name?.trim();
      if (name && !brandMap.has(name)) {
        brandMap.set(name, 0);
      }
    });

    productsWithoutBrandId.forEach((item: any) => {
      const name = item.brandName?.trim();
      if (name) {
        brandMap.set(name, (brandMap.get(name) || 0) + parseInt(item.count));
      }
    });

    const brands = Array.from(brandMap.entries())
      .map(([brandName, productCount]) => ({ brandName, productCount }))
      .filter((b) => b.brandName)
      .sort((a, b) => b.productCount - a.productCount);

    return { total: brands.length, brands };
  }

  async ignoreBrandName(brandName: string) {
    await this.dataSource.query(
      `
      UPDATE products 
      SET "brandName" = NULL
      WHERE LOWER("brandName") = LOWER($1)
      `,
      [brandName.trim()]
    );

    return { message: `"${brandName}" ignored and cleared from products` };
  }

  async debugBrandData() {
    const stats = await this.dataSource.query(`
      SELECT
        (SELECT COUNT(*) FROM products WHERE "brandId" IS NOT NULL AND "brandName" IS NOT NULL AND "deletedAt" IS NULL) as "productsWithBrandId",
        (SELECT COUNT(*) FROM products WHERE "brandId" IS NULL AND "brandName" IS NOT NULL AND "brandName" != '' AND "deletedAt" IS NULL) as "productsWithoutBrandId",
        (SELECT COUNT(*) FROM brands WHERE verified = true) as "verifiedBrands",
        (SELECT COUNT(*) FROM brands WHERE verified = false) as "unverifiedBrands"
    `);

    const sampleBrandGrouping = await this.dataSource.query(`
      SELECT "brandName", "brandId", COUNT(*) as count
      FROM products
      WHERE "brandName" IS NOT NULL
        AND "brandName" != ''
        AND "deletedAt" IS NULL
      GROUP BY "brandName", "brandId"
      ORDER BY count DESC
      LIMIT 20
    `);

    const sampleProducts = await this.dataSource.query(`
      SELECT id, "brandName", "brandId", title
      FROM products
      WHERE "brandName" IS NOT NULL
        AND "brandName" != ''
        AND "deletedAt" IS NULL
      LIMIT 10
    `);

    return {
      stats: stats[0],
      sampleBrandGrouping,
      sampleProducts,
    };
  }
}
