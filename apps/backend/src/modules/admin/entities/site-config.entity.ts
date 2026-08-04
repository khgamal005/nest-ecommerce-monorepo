import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('site_config')
export class SiteConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  categories: any[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  banners: any[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  logos: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
