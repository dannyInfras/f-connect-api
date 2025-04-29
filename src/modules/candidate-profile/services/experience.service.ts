import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { ExperienceDto } from '@/modules/candidate-profile/dtos/experience.dto';
import { ExperienceInputDto } from '@/modules/candidate-profile/dtos/experience-input.dto';
import { Experience } from '@/modules/candidate-profile/entities/experience.entity';
import { ExperienceRepository } from '@/modules/candidate-profile/repositories/experience.repository';
import { ExperienceAclService } from '@/modules/candidate-profile/services/experience-acl.service';
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
  ) {
    this.logger.setContext(ExperienceService.name);
  }

  async findAll(actor: Actor): Promise<ExperienceDto[]> {
    if (!this.experienceAcl.forActor(actor).canDoAction('Read'))
      throw new UnauthorizedException();
    const experiences = await this.experienceRepository.findAll();
    return experiences.map((exp) => plainToInstance(ExperienceDto, exp));
  }

  async findById(ctx: RequestContext, id: string): Promise<ExperienceDto> {
    this.logger.log(ctx, `${this.findById.name} was called`);

    const actor: Actor = ctx.user!;

    if (!this.experienceAcl.forActor(actor).canDoAction(Action.Read))
      throw new UnauthorizedException();

    this.logger.log(ctx, `calling ${ExperienceRepository.name}.findById`);
    const experience = await this.experienceRepository.findById(id);
    if (!experience) throw new NotFoundException('Experience not found');

    return plainToInstance(ExperienceDto, experience);
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

    return experiences.map((exp) => plainToInstance(ExperienceDto, exp));
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
    const created = await this.experienceRepository.createExperience(dto);

    return plainToInstance(ExperienceDto, created);
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
    const updated = await this.experienceRepository.updateExperience(id, dto);

    return plainToInstance(ExperienceDto, updated);
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
