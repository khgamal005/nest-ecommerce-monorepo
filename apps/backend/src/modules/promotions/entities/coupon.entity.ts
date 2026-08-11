import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type CouponDiscountType = 'percentage' | 'fixed';

@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  public_name: string;

  @Column({ type: 'varchar' })
  discount_type: CouponDiscountType;

  @Column({ type: 'float' })
  discount_value: number;

  @Index({ unique: true })
  @Column({ type: 'varchar' })
  discount_code: string;

  @Column({ type: 'varchar', nullable: true })
  sellerId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}