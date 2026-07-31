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
import { AddressType } from './address-type.enum';
import { User } from './user.entity';

@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column('uuid')
  userId: string;

  @Column({ type: 'enum', enum: AddressType, default: AddressType.HOME })
  label: AddressType;

  @Column()
  country: string;

  @Column()
  city: string;

  @Column()
  street: string;

  @Column({ type: 'varchar', nullable: true })
  zipCode: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ default: true })
  isDefault: boolean;

  @ManyToOne(() => User, (user) => user.addresses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
