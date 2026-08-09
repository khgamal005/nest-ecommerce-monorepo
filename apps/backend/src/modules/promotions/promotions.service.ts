import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coupon } from './entities/coupon.entity';
import { CreatePromotionDto, UpdatePromotionDto } from './dto/promotion.dto';

@Injectable()
export class PromotionsService {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
  ) {}

  async findAll(): Promise<Coupon[]> {
    return this.couponRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({ where: { id } });
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    return coupon;
  }

  async findByCode(code: string): Promise<Coupon | null> {
    return this.couponRepository.findOne({ where: { discount_code: code } });
  }

  async create(dto: CreatePromotionDto): Promise<Coupon> {
    const coupon = this.couponRepository.create({
      public_name: dto.public_name,
      discount_type: dto.discount_type,
      discount_value: dto.discount_value,
      discount_code: dto.discount_code,
    });
    return this.couponRepository.save(coupon);
  }

  async update(id: string, dto: UpdatePromotionDto): Promise<Coupon> {
    await this.findOne(id);
    await this.couponRepository.update(id, {
      public_name: dto.public_name,
      discount_type: dto.discount_type,
      discount_value: dto.discount_value,
      discount_code: dto.discount_code,
    });
    return this.findOne(id);
  }

  async remove(id: string): Promise<{ id: string; deleted: true }> {
    await this.findOne(id);
    await this.couponRepository.delete(id);
    return { id, deleted: true };
  }
}
