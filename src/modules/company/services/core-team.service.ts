import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  CreateCoreTeamDto,
  UpdateCoreTeamDto,
} from '@/modules/company/dtos/req/coreteam.req';
import { CoreTeamMemberResDto } from '@/modules/company/dtos/res/core-team.res';
import { Company } from '@/modules/company/entities/company.entity';
import { CoreTeam } from '@/modules/company/entities/coreteam.entity';
import { Action } from '@/shared/acl/action.constant';
import { Actor } from '@/shared/acl/actor.constant';

import { CoreTeamAclService } from '../acl/coreteam.acl';

@Injectable()
export class CoreTeamService {
  constructor(
    @InjectRepository(CoreTeam)
    private coreTeamRepository: Repository<CoreTeam>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    private aclService: CoreTeamAclService,
  ) {}

  async create(
    actor: Actor,
    companyId: string,
    dto: CreateCoreTeamDto,
  ): Promise<CoreTeamMemberResDto> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (!this.aclService.forActor(actor).canDoAction(Action.Create)) {
      throw new UnauthorizedException();
    }

    const member = this.coreTeamRepository.create({
      ...dto,
      company,
    });

    const saved = await this.coreTeamRepository.save(member);
    return this.mapToDto(saved);
  }

  async findAll(
    actor: Actor,
    companyId: string,
  ): Promise<CoreTeamMemberResDto[]> {
    const members = await this.coreTeamRepository.find({
      where: { company: { id: companyId } },
    });

    if (!this.aclService.forActor(actor).canDoAction(Action.List)) {
      throw new UnauthorizedException();
    }

    return members.map((member) => this.mapToDto(member));
  }

  async update(
    actor: Actor,
    companyId: string,
    id: string,
    dto: UpdateCoreTeamDto,
  ): Promise<CoreTeamMemberResDto> {
    const member = await this.coreTeamRepository.findOne({
      where: { id, company: { id: companyId } },
      relations: ['company'],
    });

    if (!member) {
      throw new NotFoundException('Core team member not found');
    }

    if (!this.aclService.forActor(actor).canDoAction(Action.Update, member)) {
      throw new UnauthorizedException();
    }

    const updated = await this.coreTeamRepository.save({
      ...member,
      ...dto,
    });

    return this.mapToDto(updated);
  }

  async remove(actor: Actor, companyId: string, id: string): Promise<void> {
    const member = await this.coreTeamRepository.findOne({
      where: { id, company: { id: companyId } },
      relations: ['company'],
    });

    if (!member) {
      throw new NotFoundException('Core team member not found');
    }

    if (!this.aclService.forActor(actor).canDoAction(Action.Delete, member)) {
      throw new UnauthorizedException();
    }

    await this.coreTeamRepository.remove(member);
  }

  private mapToDto(member: CoreTeam): CoreTeamMemberResDto {
    return {
      id: member.id,
      name: member.name,
      position: member.position,
      imageUrl: member.imageUrl,
    };
  }
}
