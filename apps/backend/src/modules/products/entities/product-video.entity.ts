import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('product_videos')
export class ProductVideo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  url: string;

  @Column({ type: 'varchar', nullable: true })
  r2_key: string | null;

  @Column({ type: 'varchar' })
  mime_type: string;

  @Column({ type: 'int', nullable: true })
  size_bytes: number | null;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  productId: string | null;

  @Column({ type: 'uuid', nullable: true })
  productVariantId: string | null;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ManyToOne('ProductVariant', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productVariantId' })
  variant: any;

  @CreateDateColumn()
  createdAt: Date;
}
