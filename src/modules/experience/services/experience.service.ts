import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { CandidateProfileService } from '@/modules/candidate-profile/services/candidate-profile.service';
import { ExperienceDto } from '@/modules/experience/dtos/experience.dto';
import { ExperienceInputDto } from '@/modules/experience/dtos/experience-input.dto';
import { Experience } from '@/modules/experience/entities/experience.entity';
import { ExperienceRepository } from '@/modules/experience/repositories/experience.repository';
import { ExperienceAclService } from '@/modules/experience/services/experience-acl.service';
import { Action } from '@/shared/acl/action.constant';
import { Actor } from '@/shared/acl/actor.constant';
import { AppLogger } from '@/shared/logger/logger.service';
import { RequestContext } from '@/shared/request-context/request-context.dto';

@Injectable()
export class ExperienceService {
  constructor(
    private readonly experienceRepository: ExperienceRepository,
    private readonly experienceAcl: ExperienceAclService,
    private readonly logger: AppLogger,
    private readonly candidateProfileService: CandidateProfileService,
  ) {
    this.logger.setContext(ExperienceService.name);
  }

  async findAll(actor: Actor): Promise<ExperienceDto[]> {
    if (!this.experienceAcl.forActor(actor).canDoAction('Read'))
      throw new UnauthorizedException();
    const experiences = await this.experienceRepository.findAll();
    return experiences.map((exp) =>
      plainToInstance(ExperienceDto, exp, { excludeExtraneousValues: true }),
    );
  }

  async findById(ctx: RequestContext, id: string): Promise<ExperienceDto> {
    this.logger.log(ctx, `${this.findById.name} was called`);

    const actor: Actor = ctx.user!;

    if (!this.experienceAcl.forActor(actor).canDoAction(Action.Read))
      throw new UnauthorizedException();

    this.logger.log(ctx, `calling ${ExperienceRepository.name}.findById`);
    const experience = await this.experienceRepository.findById(id);
    if (!experience) throw new NotFoundException('Experience not found');

    return plainToInstance(ExperienceDto, experience, {
      excludeExtraneousValues: true,
    });
  }

  async findByCandidateProfile(
    ctx: RequestContext,
    candidateProfileId: string,
  ): Promise<ExperienceDto[]> {
    this.logger.log(ctx, `${this.findByCandidateProfile.name} was called`);

    const actor: Actor = ctx.user!;

    if (!this.experienceAcl.forActor(actor).canDoAction(Action.Read))
      throw new UnauthorizedException();

    this.logger.log(
      ctx,
      `calling ${ExperienceRepository.name}.findByCandidateProfile`,
    );
    const experiences =
      await this.experienceRepository.findByCandidateProfile(
        candidateProfileId,
      );

    return experiences.map((exp) =>
      plainToInstance(ExperienceDto, exp, { excludeExtraneousValues: true }),
    );
  }

  async createExperience(
    ctx: RequestContext,
    dto: ExperienceInputDto,
  ): Promise<ExperienceDto> {
    this.logger.log(ctx, `${this.createExperience.name} was called`);

    const actor: Actor = ctx.user!;
    const experience = plainToInstance(Experience, dto);

    if (
      !this.experienceAcl.forActor(actor).canDoAction(Action.Create, experience)
    )
      throw new UnauthorizedException();

    this.logger.log(
      ctx,
      `calling ${ExperienceRepository.name}.createExperience`,
    );

    const profileId = Number(
      await this.candidateProfileService.getProfileIdByUserId(ctx),
    );

    const {
      role,
      description,
      location,
      startDate,
      endDate,
      employmentType,
      company,
    } = dto;

    // Use candidate_profile_id which will be handled by the repository
    const experienceData = {
      role,
      company,
      description,
      employmentType,
      location,
      startDate,
      endDate,
      candidate_profile_id: profileId.toString(),
    };

    const created =
      await this.experienceRepository.createExperience(experienceData);

    return plainToInstance(ExperienceDto, created, {
      excludeExtraneousValues: true,
    });
  }

  async updateExperience(
    ctx: RequestContext,
    id: string,
    dto: ExperienceInputDto,
  ): Promise<ExperienceDto> {
    this.logger.log(ctx, `${this.updateExperience.name} was called`);

    const actor: Actor = ctx.user!;

    this.logger.log(ctx, `calling ${ExperienceRepository.name}.findById`);
    const experience = await this.experienceRepository.findById(id);
    if (!experience) throw new NotFoundException('Experience not found');

    if (
      !this.experienceAcl.forActor(actor).canDoAction(Action.Update, experience)
    )
      throw new UnauthorizedException();

    this.logger.log(
      ctx,
      `calling ${ExperienceRepository.name}.updateExperience`,
    );

    const {
      role,
      description,
      location,
      startDate,
      endDate,
      employmentType,
      company,
    } = dto;

    // Make sure to maintain the existing candidateProfile relationship
    const experienceData = {
      role,
      company,
      description,
      employmentType,
      location,
      startDate,
      endDate,
      candidate_profile_id: experience.candidateProfile.id,
    };

    const updated = await this.experienceRepository.updateExperience(
      id,
      experienceData,
    );

    // Transform to DTO to exclude unwanted properties
    return plainToInstance(ExperienceDto, updated, {
      excludeExtraneousValues: true,
    });
  }

  async deleteExperience(
    ctx: RequestContext,
    id: string,
  ): Promise<{ deleted: boolean }> {
    this.logger.log(ctx, `${this.deleteExperience.name} was called`);

    const actor: Actor = ctx.user!;

    this.logger.log(ctx, `calling ${ExperienceRepository.name}.findById`);
    const experience = await this.experienceRepository.findById(id);
    if (!experience) throw new NotFoundException('Experience not found');

    if (
      !this.experienceAcl.forActor(actor).canDoAction(Action.Delete, experience)
    )
      throw new UnauthorizedException();

    this.logger.log(
      ctx,
      `calling ${ExperienceRepository.name}.deleteExperience`,
    );
    return this.experienceRepository.deleteExperience(id);
  }
}
