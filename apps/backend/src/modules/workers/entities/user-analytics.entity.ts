import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('user_analytics')
export class UserAnalytics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  actions: any[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  recommendations: string[];

  @Column({ type: 'timestamp', nullable: true })
  lastTrainedAt: Date | null;

  @Column({ type: 'varchar', nullable: true })
  device: string | null;

  @Column({ type: 'varchar', nullable: true })
  city: string | null;

  @Column({ type: 'timestamp', nullable: true })
  lastVisited: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}