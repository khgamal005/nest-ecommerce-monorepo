import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type AdminNotificationType =
  | 'NEW_ORDER'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'SELLER_REGISTERED'
  | 'SELLER_VERIFICATION'
  | 'PRODUCT_REVIEW'
  | 'LOW_STOCK'
  | 'ORDER_ISSUE'
  | 'USER_REPORT'
  | 'REFUND_REQUESTED'
  | 'REFUND_APPROVED'
  | 'REFUND_REJECTED'
  | 'SYSTEM_ERROR'
  | 'SECURITY_ALERT';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  creatorId: string | null;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  recipientId: string | null;

  @Column({ type: 'varchar', nullable: true })
  recipientRole: string | null;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', nullable: true })
  redirectLink: string | null;

  @Column({ type: 'varchar' })
  type: AdminNotificationType;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}