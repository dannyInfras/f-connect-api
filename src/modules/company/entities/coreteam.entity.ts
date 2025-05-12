import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Company } from './company.entity';

@Entity('core_team')
export class CoreTeam {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column()
  name: string;

  @Column()
  position: string;

  @Column({ name: 'image_url' })
  imageUrl: string;

  @ManyToOne(() => Company, (company) => company.coreTeam)
  @JoinColumn({ name: 'company_id' })
  company: Company;
}
