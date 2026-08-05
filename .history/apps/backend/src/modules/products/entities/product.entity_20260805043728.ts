import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductStatus } from './product-status.enum';
import { Brand } from '../../brands/entities/brand.entity';
import { Category } from '../../categories/entities/category.entity';
import { Image } from './image.entity';
import { ProductVideo } from './product-video.entity';
import { ProductOption } from './product-option.entity';
import { ProductVariant } from './product-variant.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  title: string;

  @Index()
  @Column({ type: 'varchar' })
  slug: string;

  // Category
  @Column({ type: 'uuid', nullable: true })
  categoryLevel1Id: string | null;

  @Column({ type: 'uuid', nullable: true })
  categoryLevel2Id: string | null;

  @Column({ type: 'uuid', nullable: true })
  categoryLevel3Id: string | null;

  @Column({ type: 'varchar' })
  categoryPath: string;

  @Index()
  @Column({ type: 'uuid' })
  categoryId: string;

  @ManyToOne(() => Category, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ type: 'varchar' })
  short_description: string;

  @Column({ type: 'text' })
  detailed_description: string;

  @OneToMany(() => Image, (image) => image.product)
  images: Image[];

  @OneToMany(() => ProductVideo, (video) => video.product)
  videos: ProductVideo[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  tags: string[];

  // Brand
  @Column({ type: 'uuid', nullable: true })
  brandId: string | null;

  @Column({ type: 'varchar', nullable: true })
  brandName: string | null;

  @ManyToOne(() => Brand, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'brandId' })
  brand: Brand;

  @Column({ default: false })
  hasVariants: boolean;

  @Column({ type: 'float', default: 5 })
  rating: number;

  @Column({ type: 'int', default: 0 })
  reviewCount: number;

  @Column({ type: 'varchar', nullable: true })
  warranty: string | null;

  @Column({ type: 'jsonb', nullable: true })
  custom_specifications: any;

  @Column({ type: 'jsonb', nullable: true })
  customProperties: any;

  @Column({ type: 'varchar', nullable: true })
  cashOnDelivery: string | null;

  @Column({ default: true })
  isReturnable: boolean;

  @Column({ type: 'int', default: 0 })
  totalSales: number;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.ACTIVE,
  })
  status: ProductStatus;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ type: 'varchar', nullable: true })
  rejectionReason: string | null;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  reviewedBy: string | null;

  @Index()
  @Column({ type: 'uuid' })
  shopId: string;

  @Column({ type: 'uuid' })
  sellerId: string;

  // TODO: Add Shop relation when Shop entity is created
  // @ManyToOne(() => Shop, { onDelete: 'CASCADE' })
  // @JoinColumn({ name: 'shopId' })
  // shop: Shop;

  // TODO: Add ProductType enum when created
  // @Column({
  //   type: 'enum',
  //   enum: ProductType,
  //   default: ProductType.PHYSICAL,
  // })
  // type: ProductType;

  @OneToMany(() => ProductOption, (option) => option.product)
  options: ProductOption[];

  @OneToMany(() => ProductVariant, (variant) => variant.product)
  variants: ProductVariant[];

  // TODO: Add ProductReview relation when created
  // @OneToMany(() => ProductReview, (review) => review.product)
  // reviews: ProductReview[];

  // TODO: Add OrderItem relation when created
  // @OneToMany(() => OrderItem, (item) => item.product)
  // orderItems: OrderItem[];

  // TODO: Add TravelDetails relation when created
  // @OneToOne(() => TravelDetails, (travel) => travel.product)
  // travelDetails: TravelDetails;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;
}