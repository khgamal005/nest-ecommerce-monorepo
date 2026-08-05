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
import { ProductOption } from './product-option.entity';

@Entity('product_option_values')
export class ProductOptionValue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  optionId: string;

  @Column({ type: 'varchar' })
  value: string;

  @ManyToOne(() => ProductOption, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'optionId' })
  option: ProductOption;

  @OneToMany('VariantOptionValue', 'optionValue')
  variantValues: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
