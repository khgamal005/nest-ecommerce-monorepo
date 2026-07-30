import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';

// TODO: replace with TypeORM repository injected via @InjectRepository(ProductEntity)
@Injectable()
export class ProductsService {
  async findAll() {
    return [];
  }

  async findBySlug(_slug: string) {
    const product = null; // TODO: query DB
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(dto: CreateProductDto) {
    return { id: 'temp-id', ...dto, isActive: true };
  }

  async update(id: string, dto: Partial<CreateProductDto>) {
    return { id, ...dto };
  }

  async remove(id: string) {
    return { id, deleted: true };
  }
}
