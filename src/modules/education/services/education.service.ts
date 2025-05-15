import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { CandidateProfileService } from '@/modules/candidate-profile/services/candidate-profile.service';
import { EducationDto } from '@/modules/education/dtos/education.dto';
import { EducationInputDto } from '@/modules/education/dtos/education-input.dto';
import { Education } from '@/modules/education/entities/education.entity';
import { EducationRepository } from '@/modules/education/repositories/education.repository';
import { EducationAclService } from '@/modules/education/services/education-acl.service';
import { Action } from '@/shared/acl/action.constant';
import { Actor } from '@/shared/acl/actor.constant';
import { AppLogger } from '@/shared/logger/logger.service';
import { RequestContext } from '@/shared/request-context/request-context.dto';

@Injectable()
export class EducationService {
  constructor(
    private readonly educationRepository: EducationRepository,
    private readonly educationAcl: EducationAclService,
    private readonly logger: AppLogger,
    private readonly candidateProfileService: CandidateProfileService,
  ) {
    this.logger.setContext(EducationService.name);
  }

  async findAll(actor: Actor): Promise<EducationDto[]> {
    if (!this.educationAcl.forActor(actor).canDoAction('Read'))
      throw new UnauthorizedException();
    const educations = await this.educationRepository.findAll();
    return educations.map((edu) =>
      plainToInstance(EducationDto, edu, { excludeExtraneousValues: true }),
    );
  }

  async findById(ctx: RequestContext, id: string): Promise<EducationDto> {
    this.logger.log(ctx, `${this.findById.name} was called`);

    const actor: Actor = ctx.user!;

    if (!this.educationAcl.forActor(actor).canDoAction(Action.Read))
      throw new UnauthorizedException();

    this.logger.log(ctx, `calling ${EducationRepository.name}.findById`);
    const education = await this.educationRepository.findById(id);
    if (!education) throw new NotFoundException('Education not found');

    return plainToInstance(EducationDto, education, {
      excludeExtraneousValues: true,
    });
  }

  async findByCandidateProfile(
    ctx: RequestContext,
    candidateProfileId: string,
  ): Promise<EducationDto[]> {
    this.logger.log(ctx, `${this.findByCandidateProfile.name} was called`);

    const actor: Actor = ctx.user!;

    if (!this.educationAcl.forActor(actor).canDoAction(Action.Read))
      throw new UnauthorizedException();

    this.logger.log(
      ctx,
      `calling ${EducationRepository.name}.findByCandidateProfile`,
    );
    const educations =
      await this.educationRepository.findByCandidateProfile(candidateProfileId);

    return educations.map((edu) =>
      plainToInstance(EducationDto, edu, { excludeExtraneousValues: true }),
    );
  }

  async createEducation(
    ctx: RequestContext,
    dto: EducationInputDto,
  ): Promise<EducationDto> {
    this.logger.log(ctx, `${this.createEducation.name} was called`);

    const actor: Actor = ctx.user!;
    const education = plainToInstance(Education, dto);

    if (
      !this.educationAcl.forActor(actor).canDoAction(Action.Create, education)
    )
      throw new UnauthorizedException();

    this.logger.log(ctx, `calling ${EducationRepository.name}.createEducation`);

    const profileId = Number(
      await this.candidateProfileService.getProfileIdByUserId(ctx),
    );

    const { institution, degree, field, startYear, endYear, description } = dto;

    const educationData = {
      institution,
      degree,
      field,
      startYear,
      endYear,
      description,
      candidate_profile_id: profileId.toString(),
    };

    const created =
      await this.educationRepository.createEducation(educationData);

    return plainToInstance(EducationDto, created, {
      excludeExtraneousValues: true,
    });
  }

  async updateEducation(
    ctx: RequestContext,
    id: string,
    dto: EducationInputDto,
  ): Promise<EducationDto> {
    this.logger.log(ctx, `${this.updateEducation.name} was called`);

    const actor: Actor = ctx.user!;

    this.logger.log(ctx, `calling ${EducationRepository.name}.findById`);
    const education = await this.educationRepository.findById(id);
    if (!education) throw new NotFoundException('Education not found');

    if (
      !this.educationAcl.forActor(actor).canDoAction(Action.Update, education)
    )
      throw new UnauthorizedException();

    this.logger.log(ctx, `calling ${EducationRepository.name}.updateEducation`);

    const { institution, degree, field, startYear, endYear, description } = dto;

    const educationData = {
      institution,
      degree,
      field,
      startYear,
      endYear,
      description,
      candidate_profile_id: education.candidateProfile.id,
    };

    const updated = await this.educationRepository.updateEducation(
      id,
      educationData,
    );

    return plainToInstance(EducationDto, updated, {
      excludeExtraneousValues: true,
    });
  }

  async deleteEducation(
    ctx: RequestContext,
    id: string,
  ): Promise<{ deleted: boolean }> {
    this.logger.log(ctx, `${this.deleteEducation.name} was called`);

    const actor: Actor = ctx.user!;

    this.logger.log(ctx, `calling ${EducationRepository.name}.findById`);
    const education = await this.educationRepository.findById(id);
    if (!education) throw new NotFoundException('Education not found');

    if (
      !this.educationAcl.forActor(actor).canDoAction(Action.Delete, education)
    )
      throw new UnauthorizedException();

    this.logger.log(ctx, `calling ${EducationRepository.name}.deleteEducation`);
    return this.educationRepository.deleteEducation(id);
  }
}
