import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Address } from './address.entity';

export type UserRole = 'user' | 'admin' | 'seller' | 'staff';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true })
  name: string | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ type: 'varchar', nullable: true })
  password: string | null;

  @OneToMany(() => Address, (address) => address.user, { cascade: true })
  addresses: Address[];

  @Column({ type: 'varchar', default: 'user' })
  role: UserRole;

  @Column({ default: false })
  isBanned: boolean;

  @Column({ type: 'timestamp', nullable: true })
  bannedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
