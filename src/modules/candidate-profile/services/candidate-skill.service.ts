import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { CandidateSkillDto } from '@/modules/candidate-profile/dtos/candidate-skill.dto';
import { CandidateSkillInputDto } from '@/modules/candidate-profile/dtos/candidate-skill-input.dto';
import { CandidateSkill } from '@/modules/candidate-profile/entities/candidate-skill.entity';
import { CandidateSkillRepository } from '@/modules/candidate-profile/repositories/candidate-skill.repository';
import { CandidateSkillAclService } from '@/modules/candidate-profile/services/candidate-skill-acl.service';
import { Action } from '@/shared/acl/action.constant';
import { Actor } from '@/shared/acl/actor.constant';
import { AppLogger } from '@/shared/logger/logger.service';
import { RequestContext } from '@/shared/request-context/request-context.dto';

@Injectable()
export class CandidateSkillService {
  constructor(
    private readonly candidateSkillRepository: CandidateSkillRepository,
    private readonly candidateSkillAcl: CandidateSkillAclService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(CandidateSkillService.name);
  }

  async findAll(actor: Actor): Promise<CandidateSkillDto[]> {
    if (!this.candidateSkillAcl.forActor(actor).canDoAction('Read'))
      throw new UnauthorizedException();
    const skills = await this.candidateSkillRepository.findAll();
    return skills.map((skill) => plainToInstance(CandidateSkillDto, skill));
  }

  async findById(ctx: RequestContext, id: string): Promise<CandidateSkillDto> {
    this.logger.log(ctx, `${this.findById.name} was called`);

    const actor: Actor = ctx.user!;

    if (!this.candidateSkillAcl.forActor(actor).canDoAction(Action.Read))
      throw new UnauthorizedException();

    this.logger.log(ctx, `calling ${CandidateSkillRepository.name}.findById`);
    const skill = await this.candidateSkillRepository.findById(id);
    if (!skill) throw new NotFoundException('CandidateSkill not found');

    return plainToInstance(CandidateSkillDto, skill);
  }

  async findByCandidateProfile(
    ctx: RequestContext,
    candidateProfileId: string,
  ): Promise<CandidateSkillDto[]> {
    this.logger.log(ctx, `${this.findByCandidateProfile.name} was called`);

    const actor: Actor = ctx.user!;

    if (!this.candidateSkillAcl.forActor(actor).canDoAction(Action.Read))
      throw new UnauthorizedException();

    this.logger.log(
      ctx,
      `calling ${CandidateSkillRepository.name}.findByCandidateProfile`,
    );
    const skills =
      await this.candidateSkillRepository.findByCandidateProfile(
        candidateProfileId,
      );

    return skills.map((skill) => plainToInstance(CandidateSkillDto, skill));
  }

  async create(
    ctx: RequestContext,
    dto: CandidateSkillInputDto,
  ): Promise<CandidateSkillDto> {
    this.logger.log(ctx, `${this.create.name} was called`);

    const actor: Actor = ctx.user!;
    const candidateSkill = plainToInstance(CandidateSkill, dto);

    if (
      !this.candidateSkillAcl
        .forActor(actor)
        .canDoAction(Action.Create, candidateSkill)
    )
      throw new UnauthorizedException();

    this.logger.log(
      ctx,
      `calling ${CandidateSkillRepository.name}.createCandidateSkill`,
    );
    const created =
      await this.candidateSkillRepository.createCandidateSkill(dto);

    return plainToInstance(CandidateSkillDto, created);
  }

  async update(
    ctx: RequestContext,
    id: string,
    dto: CandidateSkillInputDto,
  ): Promise<CandidateSkillDto> {
    this.logger.log(ctx, `${this.update.name} was called`);

    const actor: Actor = ctx.user!;

    this.logger.log(ctx, `calling ${CandidateSkillRepository.name}.findById`);
    const skill = await this.candidateSkillRepository.findById(id);
    if (!skill) throw new NotFoundException('CandidateSkill not found');

    if (
      !this.candidateSkillAcl.forActor(actor).canDoAction(Action.Update, skill)
    )
      throw new UnauthorizedException();

    this.logger.log(
      ctx,
      `calling ${CandidateSkillRepository.name}.updateCandidateSkill`,
    );
    const updated = await this.candidateSkillRepository.updateCandidateSkill(
      id,
      dto,
    );

    return plainToInstance(CandidateSkillDto, updated);
  }

  async delete(ctx: RequestContext, id: string): Promise<{ deleted: boolean }> {
    this.logger.log(ctx, `${this.delete.name} was called`);

    const actor: Actor = ctx.user!;

    this.logger.log(ctx, `calling ${CandidateSkillRepository.name}.findById`);
    const skill = await this.candidateSkillRepository.findById(id);
    if (!skill) throw new NotFoundException('CandidateSkill not found');

    if (
      !this.candidateSkillAcl.forActor(actor).canDoAction(Action.Delete, skill)
    )
      throw new UnauthorizedException();

    this.logger.log(
      ctx,
      `calling ${CandidateSkillRepository.name}.deleteCandidateSkill`,
    );
    return this.candidateSkillRepository.deleteCandidateSkill(id);
  }
}
