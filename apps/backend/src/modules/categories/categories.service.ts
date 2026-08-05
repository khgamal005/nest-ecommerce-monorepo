import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { SiteConfig } from '../admin/entities/site-config.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(SiteConfig)
    private readonly siteConfigRepository: Repository<SiteConfig>,
  ) {}

  // Get categories from SiteConfig (for frontend display)
  async getCategories() {
    const config = await this.siteConfigRepository.find({
      order: { createdAt: 'ASC' },
      take: 1,
    });
    const siteConfig = config[0];

    return {
      categories: siteConfig?.categories || [],
      message: siteConfig
        ? 'Categories fetched successfully'
        : 'No categories configured yet',
    };
  }

  // Get all categories from Category model (with hierarchy)
  async getAllCategoriesFromDB(level?: string) {
    const where: any = {};
    if (level) {
      where.level = parseInt(level, 10);
    }

    const categories = await this.categoriesRepository.find({
      where,
      relations: {
        children: {
          children: true,
        },
        parent: true,
      },
      order: { level: 'ASC', name: 'ASC' },
    });

    return {
      success: true,
      categories,
      message: 'Categories fetched successfully',
    };
  }

  async findAll() {
    const categories = await this.categoriesRepository.find({
      relations: {
        children: {
          children: true,
        },
        parent: true,
      },
      order: { level: 'ASC', name: 'ASC' },
    });
    return categories;
  }

  // Get category by slug with paginated products
  async getCategoryBySlug(slug: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const category = await this.categoriesRepository.findOne({
      where: { slug },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Build dynamic filter depending on level
    const categoryFilter: any = { status: 'active', isDeleted: false };
    if (category.level === 1) {
      categoryFilter.categoryLevel1Id = category.id;
    } else if (category.level === 2) {
      categoryFilter.categoryLevel2Id = category.id;
    } else if (category.level === 3) {
      categoryFilter.categoryLevel3Id = category.id;
    }

    const [products, total] = await Promise.all([
      this.productsRepository.find({
        where: categoryFilter,
        skip,
        take: limit,
        order: { createdAt: 'DESC' },
      }),
      this.productsRepository.count({ where: categoryFilter }),
    ]);

    return {
      success: true,
      category,
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: { parent: true, children: true },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async create(dto: CreateCategoryDto) {
    const { name, slug, level, parentId, commissionRate } = dto;

    // If level > 1, parentId is required
    if (level > 1 && !parentId) {
      throw new BadRequestException(`Parent category is required for level ${level}`);
    }

    const existing = await this.categoriesRepository.findOne({
      where: { slug },
    });

    if (existing) {
      throw new BadRequestException('Category with this slug already exists');
    }

    // Build path based on parent
    let path = `/${slug}/`;
    if (parentId) {
      const parent = await this.categoriesRepository.findOne({
        where: { id: parentId },
        select: { path: true },
      });
      if (parent) {
        path = `${parent.path}${slug}/`;
      }
    }

    const category = await this.categoriesRepository.save(
      this.categoriesRepository.create({
        name,
        slug,
        level,
        path,
        parentId: parentId || null,
        commissionRate,
      }),
    );

    return {
      success: true,
      category,
      message: 'Category created successfully',
    };
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const { name, slug, parentId, level, commissionRate } = dto;

    const currentCategory = await this.categoriesRepository.findOne({
      where: { id },
      select: { id: true, path: true, slug: true, parentId: true },
    });

    if (!currentCategory) {
      throw new NotFoundException('Category not found');
    }

    const updateData: Partial<Category> = {};
    if (name) updateData.name = name;
    if (slug) updateData.slug = slug;
    if (parentId !== undefined) updateData.parentId = parentId;
    if (level !== undefined) updateData.level = level;
    if (commissionRate !== undefined) updateData.commissionRate = commissionRate;

    // Recalculate path if slug or parentId changed
    if (slug || parentId !== undefined) {
      const newSlug = slug || currentCategory.slug;
      const newParentId =
        parentId !== undefined ? parentId : currentCategory.parentId;

      let path = `/${newSlug}/`;
      if (newParentId) {
        const parent = await this.categoriesRepository.findOne({
          where: { id: newParentId },
          select: { path: true },
        });
        if (parent) {
          path = `${parent.path}${newSlug}/`;
        }
      }
      updateData.path = path;
    }

    await this.categoriesRepository.update({ id }, updateData);

    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: { parent: true, children: true },
    });

    return {
      success: true,
      category,
      message: 'Category updated successfully',
    };
  }

  async remove(id: string) {
    const category = await this.categoriesRepository.findOne({
      where: { id },
      relations: { children: true },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category.children.length > 0) {
      throw new BadRequestException('Cannot delete category with subcategories');
    }

    const productCount = await this.productsRepository.count({
      where: [
        { categoryLevel1Id: id },
        { categoryLevel2Id: id },
        { categoryLevel3Id: id },
      ],
    });

    if (productCount > 0) {
      throw new BadRequestException('Cannot delete category with products');
    }

    await this.categoriesRepository.delete({ id });

    return { success: true, message: 'Category deleted successfully' };
  }
}