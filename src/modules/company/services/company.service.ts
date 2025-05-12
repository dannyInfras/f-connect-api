import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeepPartial } from 'typeorm';

import { CompanyAclService } from '@/modules/company/acl/company.acl';
import { CreateCompanyReqDto } from '@/modules/company/dtos/req/create-company.req';
import { UpdateCompanyDto } from '@/modules/company/dtos/req/update-company.req';
import { CompanyMapper } from '@/modules/company/mapper/company.map';
import { Action } from '@/shared/acl/action.constant';
import { Actor } from '@/shared/acl/actor.constant';

import { Company } from '../entities/company.entity';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    private readonly aclService: CompanyAclService,
  ) {}

  async create(dto: CreateCompanyReqDto, actor: Actor) {
    if (!this.aclService.forActor(actor).canDoAction(Action.Create)) {
      throw new UnauthorizedException();
    }

    const companyData: DeepPartial<Company> = {
      ...dto,
      user: { id: actor.id },
      address: Array.isArray(dto.address) ? dto.address : [],
      socialMedia: Array.isArray(dto.socialMedia) ? dto.socialMedia : [],
      workImageUrl: Array.isArray(dto.workImageUrl) ? dto.workImageUrl : [],
    };

    const company = this.companyRepo.create(companyData);
    return this.companyRepo.save(company);
  }

  async findOne(id: string, actor: Actor) {
    const company = await this.companyRepo.findOne({
      where: { id },
      relations: ['user', 'benefits', 'coreTeam', 'jobs', 'jobs.category'],
    });

    if (!company) throw new NotFoundException('Company not found');

    if (!this.aclService.forActor(actor).canDoAction(Action.Read, company)) {
      throw new UnauthorizedException();
    }

    return CompanyMapper.toDetailResponse(company);
  }

  async findAll(
    actor: Actor,
    limit: number,
    offset: number,
  ): Promise<{ companies: Company[]; count: number }> {
    if (!this.aclService.forActor(actor).canDoAction(Action.List)) {
      throw new UnauthorizedException('Only admin can list all companies');
    }

    const [companies, count] = await this.companyRepo.findAndCount({
      where: {},
      take: limit,
      skip: offset,
      relations: ['user'],
      order: {
        createdAt: 'DESC',
      },
    });

    return { companies, count };
  }

  async update(id: string, dto: UpdateCompanyDto, actor: Actor) {
    const company = await this.companyRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!company) throw new NotFoundException('Company not found');

    if (!this.aclService.forActor(actor).canDoAction(Action.Update, company)) {
      throw new UnauthorizedException();
    }

    Object.assign(company, dto);
    return this.companyRepo.save(company);
  }

  async delete(id: string, actor: Actor) {
    const company = await this.companyRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!company) throw new NotFoundException('Company not found');

    if (!this.aclService.forActor(actor).canDoAction(Action.Delete, company)) {
      throw new UnauthorizedException();
    }

    return this.companyRepo.remove(company);
  }
}
