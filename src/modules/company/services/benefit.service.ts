import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BenefitAclService } from '@/modules/company/acl/benefit.acl';
import {
  CreateBenefitDto,
  UpdateBenefitDto,
} from '@/modules/company/dtos/req/benefit.req';
import { BenefitResDto } from '@/modules/company/dtos/res/benefit.res';
import { Benefit } from '@/modules/company/entities/benefit.entity';
import { Company } from '@/modules/company/entities/company.entity';
import { Action } from '@/shared/acl/action.constant';
import { Actor } from '@/shared/acl/actor.constant';

@Injectable()
export class BenefitService {
  constructor(
    @InjectRepository(Benefit)
    private benefitRepository: Repository<Benefit>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    private aclService: BenefitAclService,
  ) {}

  async create(
    actor: Actor,
    companyId: string,
    dto: CreateBenefitDto,
  ): Promise<BenefitResDto> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (!this.aclService.forActor(actor).canDoAction(Action.Create)) {
      throw new UnauthorizedException();
    }

    const benefit = this.benefitRepository.create({
      ...dto,
      company,
    });

    const saved = await this.benefitRepository.save(benefit);
    return this.mapToDto(saved);
  }

  async findAll(actor: Actor, companyId: string): Promise<BenefitResDto[]> {
    const benefits = await this.benefitRepository.find({
      where: { company: { id: companyId } },
    });

    if (!this.aclService.forActor(actor).canDoAction(Action.List)) {
      throw new UnauthorizedException();
    }

    return benefits.map((benefit) => this.mapToDto(benefit));
  }

  async update(
    actor: Actor,
    companyId: string,
    id: string,
    dto: UpdateBenefitDto,
  ): Promise<BenefitResDto> {
    const benefit = await this.benefitRepository.findOne({
      where: { id, company: { id: companyId } },
      relations: ['company'],
    });

    if (!benefit) {
      throw new NotFoundException('Benefit not found');
    }

    if (!this.aclService.forActor(actor).canDoAction(Action.Update, benefit)) {
      throw new UnauthorizedException();
    }

    const updated = await this.benefitRepository.save({
      ...benefit,
      ...dto,
    });

    return this.mapToDto(updated);
  }

  async remove(actor: Actor, companyId: string, id: string): Promise<void> {
    const benefit = await this.benefitRepository.findOne({
      where: { id, company: { id: companyId } },
      relations: ['company'],
    });

    if (!benefit) {
      throw new NotFoundException('Benefit not found');
    }

    if (!this.aclService.forActor(actor).canDoAction(Action.Delete, benefit)) {
      throw new UnauthorizedException();
    }

    await this.benefitRepository.remove(benefit);
  }

  private mapToDto(benefit: Benefit): BenefitResDto {
    return {
      id: benefit.id,
      name: benefit.name,
      description: benefit.description,
      iconUrl: benefit.iconUrl,
    };
  }
}
