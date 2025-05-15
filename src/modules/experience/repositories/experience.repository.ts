import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Experience } from '../entities/experience.entity';

@Injectable()
export class ExperienceRepository {
  constructor(
    @InjectRepository(Experience)
    private readonly repo: Repository<Experience>,
  ) {}

  async findAll(): Promise<Experience[]> {
    return this.repo.find({
      relations: ['candidateProfile', 'candidateProfile.user'],
    });
  }

  async findById(id: string): Promise<Experience | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['candidateProfile', 'candidateProfile.user'],
    });
  }

  async findByCandidateProfile(
    candidateProfileId: string,
  ): Promise<Experience[]> {
    return this.repo.find({
      where: { candidateProfile: { id: candidateProfileId } },
      relations: ['candidateProfile', 'candidateProfile.user'],
    });
  }

  async createExperience(
    data: Partial<Experience> & { candidate_profile_id?: string },
  ): Promise<Experience> {
    if (data.candidate_profile_id) {
      data.candidateProfile = { id: data.candidate_profile_id } as any;
      delete data.candidate_profile_id;
    }

    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async updateExperience(
    id: string,
    data: Partial<Experience> & { candidate_profile_id?: string },
  ): Promise<Experience> {
    if (data.candidate_profile_id) {
      data.candidateProfile = { id: data.candidate_profile_id } as any;
      delete data.candidate_profile_id;
    }

    await this.repo.update(id, data);
    const updated = await this.findById(id);
    if (!updated) throw new NotFoundException('Experience not found');
    return updated;
  }

  async deleteExperience(id: string): Promise<{ deleted: boolean }> {
    const result = await this.repo.delete(id);
    return { deleted: !!result.affected };
  }
}
