import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { SkillDto } from '@/modules/skill/dtos/skill.dto';
import { SkillInputDto } from '@/modules/skill/dtos/skill-input.dto';
import { SkillRepository } from '@/modules/skill/repositories/skill.repository';
import { SkillAclService } from '@/modules/skill/services/skill-acl.service';
import { Action } from '@/shared/acl/action.constant';
import { Actor } from '@/shared/acl/actor.constant';
import { AppLogger } from '@/shared/logger/logger.service';
import { RequestContext } from '@/shared/request-context/request-context.dto';

@Injectable()
export class SkillService {
  constructor(
    private readonly skillRepository: SkillRepository,
    private readonly skillAcl: SkillAclService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(SkillService.name);
  }

  async findAll(ctx: RequestContext): Promise<SkillDto[]> {
    this.logger.log(ctx, `${this.findAll.name} was called`);

    const actor: Actor = ctx.user!;

    if (!this.skillAcl.forActor(actor).canDoAction(Action.Read))
      throw new UnauthorizedException();

    this.logger.log(ctx, `calling ${SkillRepository.name}.findAll`);
    const skills = await this.skillRepository.findAll();
    return skills.map((skill) => plainToInstance(SkillDto, skill));
  }

  async findById(ctx: RequestContext, id: string): Promise<SkillDto> {
    this.logger.log(ctx, `${this.findById.name} was called`);

    const actor: Actor = ctx.user!;

    if (!this.skillAcl.forActor(actor).canDoAction(Action.Read))
      throw new UnauthorizedException();

    this.logger.log(ctx, `calling ${SkillRepository.name}.findById`);
    const skill = await this.skillRepository.findById(id);
    if (!skill) throw new NotFoundException('Skill not found');
    return plainToInstance(SkillDto, skill);
  }

  async createSkill(
    ctx: RequestContext,
    dto: SkillInputDto,
  ): Promise<SkillDto> {
    this.logger.log(ctx, `${this.createSkill.name} was called`);

    const actor: Actor = ctx.user!;

    if (!this.skillAcl.forActor(actor).canDoAction(Action.Create))
      throw new UnauthorizedException();

    this.logger.log(ctx, `calling ${SkillRepository.name}.createSkill`);
    const skill = await this.skillRepository.createSkill(dto);
    return plainToInstance(SkillDto, skill);
  }

  async updateSkill(
    ctx: RequestContext,
    id: string,
    dto: SkillInputDto,
  ): Promise<SkillDto> {
    this.logger.log(ctx, `${this.updateSkill.name} was called`);

    const actor: Actor = ctx.user!;

    if (!this.skillAcl.forActor(actor).canDoAction(Action.Update))
      throw new UnauthorizedException();

    this.logger.log(ctx, `calling ${SkillRepository.name}.updateSkill`);
    const skill = await this.skillRepository.updateSkill(id, dto);
    return plainToInstance(SkillDto, skill);
  }

  async deleteSkill(
    ctx: RequestContext,
    id: string,
  ): Promise<{ deleted: boolean }> {
    this.logger.log(ctx, `${this.deleteSkill.name} was called`);

    const actor: Actor = ctx.user!;

    if (!this.skillAcl.forActor(actor).canDoAction(Action.Delete))
      throw new UnauthorizedException();

    this.logger.log(ctx, `calling ${SkillRepository.name}.deleteSkill`);
    return this.skillRepository.deleteSkill(id);
  }
}
