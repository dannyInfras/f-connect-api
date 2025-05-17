import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { Company } from '@/modules/company/entities/company.entity';

import { Article } from '../../article/entities/article.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, name: 'full_name' })
  name: string;

  @Column({ length: 100, name: 'password' })
  password: string;

  @Unique('username', ['username'])
  @Column({ length: 30 })
  username: string;

  @Column('simple-array')
  roles: string[];

  @Column({ name: 'is_verified', default: true })
  isAccountDisabled: boolean;

  @Unique('email', ['email'])
  @Column({ length: 50 })
  email: string;

  @Unique('phone', ['phone'])
  @Column({ length: 30, nullable: true })
  phone?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Article, (article) => article.author)
  articles: Article[];

  @ManyToOne(() => Company, (company) => company.users, { nullable: true })
  company?: Company;
}
