import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In,Repository } from 'typeorm';

import { Skill } from '../entities/skill.entity';

@Injectable()
export class SkillRepository {
  constructor(
    @InjectRepository(Skill)
    private readonly repo: Repository<Skill>,
  ) {}

  async findAll(): Promise<Skill[]> {
    return this.repo.find();
  }

  async findById(id: string): Promise<Skill | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByIds(ids: string[]): Promise<Skill[]> {
    return this.repo.findBy({ id: In(ids) });
  }

  async createSkill(data: Partial<Skill>): Promise<Skill> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async updateSkill(id: string, data: Partial<Skill>): Promise<Skill> {
    await this.repo.update(id, data);
    const updated = await this.findById(id);
    if (!updated) throw new NotFoundException('Skill not found');
    return updated;
  }

  async deleteSkill(id: string): Promise<{ deleted: boolean }> {
    const result = await this.repo.delete(id);
    return { deleted: !!result.affected };
  }
}
