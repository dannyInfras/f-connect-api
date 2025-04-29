import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity('skill')
@Unique(['name'])
export class Skill {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  name: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
