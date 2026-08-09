import { Injectable } from '@nestjs/common';

// TODO: inject TypeORM repository for the notifications domain and implement real logic.
@Injectable()
export class NotificationsService {
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

  async markAllRead() {
    return { success: true, message: 'All notifications marked as read' };
  }

  async clearAll() {
    return { success: true, message: 'All notifications cleared' };
  }

  async remove(id: string) {
    return { id, deleted: true };
  }
}
