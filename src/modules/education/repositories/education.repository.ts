import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Education } from '../entities/education.entity';

@Injectable()
export class EducationRepository {
  constructor(
    @InjectRepository(Education)
    private readonly repo: Repository<Education>,
  ) {}

  async findAll(): Promise<Education[]> {
    return this.repo.find({ relations: ['candidateProfile'] });
  }

  async findById(id: string): Promise<Education | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['candidateProfile'],
    });
  }

  async findByCandidateProfile(
    candidateProfileId: string,
  ): Promise<Education[]> {
    return this.repo.find({
      where: { candidateProfile: { id: candidateProfileId } },
      relations: ['candidateProfile'],
    });
  }

  async createEducation(
    data: Partial<Education> & { candidate_profile_id?: string },
  ): Promise<Education> {
    if (data.candidate_profile_id) {
      data.candidateProfile = { id: data.candidate_profile_id } as any;
      delete data.candidate_profile_id;
    }

    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async updateEducation(
    id: string,
    data: Partial<Education> & { candidate_profile_id?: string },
  ): Promise<Education> {
    if (data.candidate_profile_id) {
      data.candidateProfile = { id: data.candidate_profile_id } as any;
      delete data.candidate_profile_id;
    }

    await this.repo.update(id, data);
    const updated = await this.findById(id);
    if (!updated) throw new NotFoundException('Education not found');
    return updated;
  }

  async deleteEducation(id: string): Promise<{ deleted: boolean }> {
    const result = await this.repo.delete(id);
    return { deleted: !!result.affected };
  }
}
