import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Company } from './company.entity';

@Entity('benefit')
export class Benefit {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column({ name: 'icon_url' })
  iconUrl: string;

  @ManyToOne(() => Company, (company) => company.benefits)
  @JoinColumn({ name: 'company_id' })
  company: Company;
}
