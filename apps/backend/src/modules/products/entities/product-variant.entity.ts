import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('product_variants')
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  productId: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', nullable: true })
  sku: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  salePrice: string | null;

  @Index()
  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  starting_date: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  ending_date: Date | null;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @OneToMany('Image', 'variant')
  images: any[];

  @OneToMany('ProductVideo', 'variant')
  videos: any[];

  @OneToMany('VariantOptionValue', 'variant')
  optionValues: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
