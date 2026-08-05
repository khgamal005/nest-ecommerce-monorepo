import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductVariant } from './product-variant.entity';
import { ProductOptionValue } from './product-option-value.entity';

@Entity('variant_option_values')
export class VariantOptionValue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  variantId: string;

  @Index()
  @Column({ type: 'uuid' })
  optionValueId: string;

  @ManyToOne(() => ProductVariant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'variantId' })
  variant: ProductVariant;

  @ManyToOne(() => ProductOptionValue, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'optionValueId' })
  optionValue: ProductOptionValue;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
