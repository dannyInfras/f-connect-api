import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CandidateSkill } from '../entities/candidate-skill.entity';

@Injectable()
export class CandidateSkillRepository {
  constructor(
    @InjectRepository(CandidateSkill)
    private readonly repo: Repository<CandidateSkill>,
  ) {}

  async findAll(): Promise<CandidateSkill[]> {
    return this.repo.find({ relations: ['candidateProfile', 'skill'] });
  }

  async findById(id: string): Promise<CandidateSkill | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['candidateProfile', 'skill'],
    });
  }

  async findByCandidateProfile(
    candidateProfileId: string,
  ): Promise<CandidateSkill[]> {
    return this.repo.find({
      where: { candidateProfile: { id: candidateProfileId } },
      relations: ['candidateProfile', 'skill'],
    });
  }

  async createCandidateSkill(
    data: Partial<CandidateSkill>,
  ): Promise<CandidateSkill> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async updateCandidateSkill(
    id: string,
    data: Partial<CandidateSkill>,
  ): Promise<CandidateSkill> {
    await this.repo.update(id, data);
    const updated = await this.findById(id);
    if (!updated) throw new NotFoundException('CandidateSkill not found');
    return updated;
  }

  async deleteCandidateSkill(id: string): Promise<{ deleted: boolean }> {
    const result = await this.repo.delete(id);
    return { deleted: !!result.affected };
  }
}
