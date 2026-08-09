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
import { User } from '../../users/entities/user.entity';
import { OrderItem } from './order-item.entity';
import { Refund } from './refund.entity';
import { OrderStatus, PaymentStatus, PaymentType } from './order-status.enum';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'float' })
  total: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ type: 'varchar', nullable: true })
  shippingAddressId: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'enum', enum: PaymentType, nullable: true })
  paymentType: PaymentType | null;

  @Column({ type: 'varchar', nullable: true })
  couponCode: string | null;

  @Column({ type: 'float', nullable: true })
  discountAmount: number | null;

  @Column({ type: 'float', default: 0 })
  shippingFee: number;

  @Column({ type: 'varchar', nullable: true })
  paymentSessionId: string | null;

  @Column({ type: 'varchar', default: 'ordered' })
  deliveryStatus: string;

  @Column({ type: 'varchar', nullable: true })
  cancelReason: string | null;

  @Column({ type: 'varchar', nullable: true })
  cancelledBy: string | null;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @OneToMany(() => Refund, (refund) => refund.order)
  refunds: Refund[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}