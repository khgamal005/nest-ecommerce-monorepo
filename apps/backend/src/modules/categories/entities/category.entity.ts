import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar' })
  slug: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  parentId: string | null;

  @ManyToOne(() => Category, (category) => category.children, {
    nullable: true,
    onDelete: 'NO ACTION',
  })
  @JoinColumn({ name: 'parentId' })
  parent: Category | null;

  @OneToMany(() => Category, (category) => category.parent)
  children: Category[];

  @Index()
  @Column({ type: 'int' })
  level: number;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  path: string | null; // e.g. "/clothes/men/shirts/"

  @Column({ type: 'float', default: 0.07 })
  commissionRate: number; // 7% default admin fee for this category

  @CreateDateColumn()
  createdAt: Date;
}