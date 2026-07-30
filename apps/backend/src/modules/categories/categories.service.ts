import { Injectable } from '@nestjs/common';

// TODO: inject TypeORM repository for the categories domain and implement real logic.
@Injectable()
export class CategoriesService {
  async findAll() {
    return [];
  }

  async findOne(id: string) {
    return { id };
  }

  async create(dto: any) {
    return { id: 'temp-id', ...dto };
  }

  async update(id: string, dto: any) {
    return { id, ...dto };
  }

  async remove(id: string) {
    return { id, deleted: true };
  }
}
