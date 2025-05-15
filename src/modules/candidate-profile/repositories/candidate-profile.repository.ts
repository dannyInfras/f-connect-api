import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';

import { CandidateProfileInputDto } from '@/modules/candidate-profile/dtos/candidate-profile-input.dto';
import { CandidateProfileResponseDto } from '@/modules/candidate-profile/dtos/candidate-profile-response.dto';
import { UpdateCandidateProfileDto } from '@/modules/candidate-profile/dtos/update-candidate-profile.dto';
import { CandidateProfile } from '@/modules/candidate-profile/entities/candidate-profile.entity';

@Injectable()
export class CandidateProfileRepository {
  constructor(
    @InjectRepository(CandidateProfile)
    private readonly repo: Repository<CandidateProfile>,
  ) {}

  async findById(id: string): Promise<CandidateProfileResponseDto | null> {
    const entity = await this.repo
      .createQueryBuilder('candidateProfile')
      .leftJoinAndSelect('candidateProfile.user', 'user')
      .leftJoinAndSelect(
        'candidateProfile.experiences',
        'experience',
        'experience.candidate_profile_id = candidateProfile.id',
      )
      .leftJoinAndSelect('candidateProfile.educations', 'education')
      .where('candidateProfile.id = :id', { id })
      .getOne();

    if (!entity) return null;
    return this.toResponseDto(entity);
  }

  async findByUserId(
    userId: number,
  ): Promise<CandidateProfileResponseDto | null> {
    const entity = await this.repo
      .createQueryBuilder('candidateProfile')
      .leftJoinAndSelect('candidateProfile.user', 'user')
      .leftJoinAndSelect(
        'candidateProfile.experiences',
        'experience',
        'experience.candidate_profile_id = candidateProfile.id',
      )
      .leftJoinAndSelect('candidateProfile.educations', 'education')
      .where('user.id = :userId', { userId })
      .getOne();

    if (!entity) return null;
    return this.toResponseDto(entity);
  }

  async getById(id: string): Promise<CandidateProfile> {
    const entity = await this.repo
      .createQueryBuilder('candidateProfile')
      .leftJoinAndSelect('candidateProfile.user', 'user')
      .leftJoinAndSelect(
        'candidateProfile.experiences',
        'experience',
        'experience.candidate_profile_id = candidateProfile.id',
      )
      .leftJoinAndSelect('candidateProfile.educations', 'education')
      .where('candidateProfile.id = :id', { id })
      .getOne();

    if (!entity) throw new NotFoundException('Candidate profile not found');
    return entity;
  }

  async findAndCount(options: any): Promise<[CandidateProfile[], number]> {
    return this.repo.findAndCount(options);
  }

  async save(profile: CandidateProfile): Promise<CandidateProfile> {
    return this.repo.save(profile);
  }

  async remove(profile: CandidateProfile): Promise<CandidateProfile> {
    return this.repo.remove(profile);
  }

  async createProfile(
    dto: CandidateProfileInputDto,
  ): Promise<CandidateProfileResponseDto> {
    const entity = this.repo.create(dto as any);
    const savedResult = await this.repo.save(entity);
    const saved = Array.isArray(savedResult) ? savedResult[0] : savedResult;
    return this.toResponseDto(saved);
  }

  async updateProfile(
    id: string,
    dto: Partial<UpdateCandidateProfileDto>,
  ): Promise<CandidateProfileResponseDto> {
    // First get the existing entity
    const existing = await this.repo.findOne({
      where: { id },
    });

    if (!existing) throw new NotFoundException('Candidate profile not found');

    // Create the update object with only the fields provided in the DTO
    const updateData = { ...dto };

    // Update the entity
    await this.repo.update(id, updateData);

    // Get the updated entity
    const updated = await this.repo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!updated) throw new NotFoundException('Candidate profile not found');
    return this.toResponseDto(updated);
  }

  async deleteProfile(id: string): Promise<{ deleted: boolean }> {
    const result = await this.repo.delete(id);
    return { deleted: !!result.affected };
  }

  private toResponseDto(entity: CandidateProfile): CandidateProfileResponseDto {
    return plainToInstance(CandidateProfileResponseDto, {
      id: entity.id,
      name: entity.user?.username || '',
      title: entity.title,
      company: entity.company,
      location: entity.location,
      avatar: entity.avatar,
      coverImage: entity.coverImage,
      isOpenToOpportunities: entity.isOpenToOpportunities,
      about: entity.about,
      contact: entity.contact || {},
      social: entity.social || {},
      experiences: entity.experiences || [],
      education: entity.educations || [],
      skills: [],
      portfolios: [],
      birthDate: entity.birthDate,
    });
  }
}
