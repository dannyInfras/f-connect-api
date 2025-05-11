import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';

import { CandidateProfileInputDto } from '@/modules/candidate-profile/dtos/candidate-profile-input.dto';
import { CandidateProfileResponseDto } from '@/modules/candidate-profile/dtos/candidate-profile-response.dto';
import { CandidateProfile } from '@/modules/candidate-profile/entities/candidate-profile.entity';
import { CandidateProfileRepository } from '@/modules/candidate-profile/repositories/candidate-profile.repository';
import { CandidateProfileAclService } from '@/modules/candidate-profile/services/candidate-profile-acl.service';
import { User } from '@/modules/user/entities/user.entity';
import { Action } from '@/shared/acl/action.constant';
import { Actor } from '@/shared/acl/actor.constant';
import { AppLogger } from '@/shared/logger/logger.service';
import { RequestContext } from '@/shared/request-context/request-context.dto';

@Injectable()
export class CandidateProfileService {
  constructor(
    private readonly candidateProfileRepository: CandidateProfileRepository,
    private readonly aclService: CandidateProfileAclService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(CandidateProfileService.name);
  }

  async getProfileById(
    ctx: RequestContext,
    id: string,
  ): Promise<CandidateProfileResponseDto> {
    this.logger.log(ctx, `${this.getProfileById.name} was called`);

    const actor: Actor = ctx.user!;

    this.logger.log(ctx, `calling ${CandidateProfileRepository.name}.findById`);
    const profile = await this.candidateProfileRepository.findById(id);

    if (!profile) {
      throw new NotFoundException('Candidate profile not found');
    }

    const isAllowed = this.aclService
      .forActor(actor)
      .canDoAction(Action.Read, profile);
    if (!isAllowed) {
      throw new UnauthorizedException();
    }

    return profile;
  }

  async getProfileIdByUserId(
    ctx: RequestContext,
  ): Promise<CandidateProfile['id']> {
    this.logger.log(ctx, `${this.getProfileIdByUserId.name} was called`);

    const actor: Actor = ctx.user!;

    if (!actor || !actor.id) {
      throw new ForbiddenException('Not allowed to access this resource');
    }

    this.logger.log(
      ctx,
      `calling ${CandidateProfileRepository.name}.findByUserId`,
    );
    const profile = await this.candidateProfileRepository.findByUserId(
      Number(ctx.user!.id),
    );

    if (!profile) {
      throw new NotFoundException('Candidate profile not found');
    }

    return profile.id;
  }

  async getCurrentUserProfile(
    ctx: RequestContext,
  ): Promise<CandidateProfileResponseDto> {
    this.logger.log(ctx, `${this.getCurrentUserProfile.name} was called`);

    const actor: Actor = ctx.user!;

    if (!actor || !actor.id) {
      throw new ForbiddenException('Not allowed to access this resource');
    }

    this.logger.log(
      ctx,
      `calling ${CandidateProfileRepository.name}.findByUserId`,
    );
    const profile = await this.candidateProfileRepository.findByUserId(
      actor.id,
    );

    if (!profile) {
      throw new NotFoundException(
        'Candidate profile not found for the current user',
      );
    }

    return profile;
  }

  async createProfile(
    ctx: RequestContext,
    dto: CandidateProfileInputDto,
  ): Promise<CandidateProfileResponseDto> {
    this.logger.log(ctx, `${this.createProfile.name} was called`);

    const actor: Actor = ctx.user!;
    const candidateProfile = plainToClass(CandidateProfile, dto);

    const isAllowed = this.aclService
      .forActor(actor)
      .canDoAction(Action.Create, candidateProfile);
    if (!isAllowed) {
      throw new UnauthorizedException();
    }

    candidateProfile.user = plainToClass(User, { id: actor.id });

    this.logger.log(
      ctx,
      `calling ${CandidateProfileRepository.name}.createProfile`,
    );
    return this.candidateProfileRepository.createProfile(dto);
  }

  async updateProfile(
    ctx: RequestContext,
    id: string,
    dto: CandidateProfileInputDto,
  ): Promise<CandidateProfileResponseDto> {
    this.logger.log(ctx, `${this.updateProfile.name} was called`);

    const actor: Actor = ctx.user!;

    this.logger.log(ctx, `calling ${CandidateProfileRepository.name}.findById`);
    const profile = await this.candidateProfileRepository.findById(id);

    if (!profile) {
      throw new NotFoundException('Candidate profile not found');
    }

    const isAllowed = this.aclService
      .forActor(actor)
      .canDoAction(Action.Update, profile);
    if (!isAllowed) {
      throw new UnauthorizedException();
    }

    this.logger.log(
      ctx,
      `calling ${CandidateProfileRepository.name}.updateProfile`,
    );
    return this.candidateProfileRepository.updateProfile(id, dto);
  }

  async deleteProfile(
    ctx: RequestContext,
    id: string,
  ): Promise<{ deleted: boolean }> {
    this.logger.log(ctx, `${this.deleteProfile.name} was called`);

    const actor: Actor = ctx.user!;

    this.logger.log(ctx, `calling ${CandidateProfileRepository.name}.findById`);
    const profile = await this.candidateProfileRepository.findById(id);

    if (!profile) {
      throw new NotFoundException('Candidate profile not found');
    }

    const isAllowed = this.aclService
      .forActor(actor)
      .canDoAction(Action.Delete, profile);
    if (!isAllowed) {
      throw new UnauthorizedException();
    }

    this.logger.log(
      ctx,
      `calling ${CandidateProfileRepository.name}.deleteProfile`,
    );
    return this.candidateProfileRepository.deleteProfile(id);
  }
}
