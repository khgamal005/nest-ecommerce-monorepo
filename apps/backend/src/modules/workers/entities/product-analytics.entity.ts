import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('product_analytics')
export class ProductAnalytics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'uuid' })
  productId: string;

  @Column({ type: 'int', default: 0 })
  views: number;

  @Column({ type: 'int', default: 0 })
  cartAdds: number;

  @Column({ type: 'int', default: 0 })
  wishlistAdds: number;

  @Column({ type: 'int', default: 0 })
  purchases: number;

  @Column({ type: 'int', default: 0 })
  cartRemovals: number;

  @Column({ type: 'int', default: 0 })
  removeFromCart: number;

  @Column({ type: 'int', default: 0 })
  removeFromWishlist: number;

  @Column({ type: 'int', default: 0 })
  quantityDecreases: number;

  @Column({ type: 'timestamp', nullable: true })
  lastVisited: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}