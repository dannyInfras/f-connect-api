import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, EntityManager, Repository } from 'typeorm';

import { JobApplication } from '@/modules/applications/entities/job-application.entity';
import { CompanyAclService } from '@/modules/company/acl/company.acl';
import { CreateCompanyReqDto } from '@/modules/company/dtos/req/create-company.req';
import { UpdateCompanyDto } from '@/modules/company/dtos/req/update-company.req';
import { CompanyMapper } from '@/modules/company/mapper/company.map';
import { Job } from '@/modules/jobs/entities/jobs.entity';
import { Action } from '@/shared/acl/action.constant';
import { Actor } from '@/shared/acl/actor.constant';

import { Company } from '../entities/company.entity';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
    @InjectRepository(JobApplication)
    private readonly applicationRepo: Repository<JobApplication>,
    private readonly aclService: CompanyAclService,
  ) {}

  async create(dto: CreateCompanyReqDto, manager?: EntityManager) {
    // Validate future dates
    if (dto.vipExpired) {
      const vip = new Date(dto.vipExpired);
      if (vip <= new Date()) {
        throw new BadRequestException(
          'VIP expiration date must be in the future',
        );
      }
    }
    if (dto.topJobExpired) {
      const top = new Date(dto.topJobExpired);
      if (top <= new Date()) {
        throw new BadRequestException(
          'Top company expiration date must be in the future',
        );
      }
    }

    const companyData: DeepPartial<Company> = {
      ...dto,
      phone: dto.phone || 0,
      email: dto.email || '...@example.com',
      address: Array.isArray(dto.address) ? dto.address : [],
      socialMedia: Array.isArray(dto.socialMedia) ? dto.socialMedia : [],
      workImageUrl: Array.isArray(dto.workImageUrl) ? dto.workImageUrl : [],
    };

    const repo = manager ? manager.getRepository(Company) : this.companyRepo;
    const company = repo.create(companyData);
    return repo.save(company);
  }

  async findOne(id: string, actor: Actor | null) {
    if (actor) {
      await this.aclService.canView();
    }

    const company = await this.companyRepo.findOne({
      where: { id },
      relations: ['users', 'benefits', 'coreTeam', 'jobs', 'jobs.category'],
    });

    if (!company) throw new NotFoundException('Company not found');

    return CompanyMapper.toDetailResponse(company);
  }

  async findAll(
    actor: Actor | null,
    limit: number,
    offset: number,
  ): Promise<{ companies: Company[]; count: number }> {
    if (actor) {
      await this.aclService.canList();
    }

    const [companies, count] = await this.companyRepo.findAndCount({
      where: {},
      take: limit,
      skip: offset,
      relations: ['users'],
      order: {
        createdAt: 'DESC',
      },
    });

    return { companies, count };
  }

  async update(id: string, dto: UpdateCompanyDto, actor?: Actor) {
    const company = await this.companyRepo.findOne({
      where: { id },
      relations: ['users'],
    });

    if (!company) throw new NotFoundException('Company not found');

    if (
      actor &&
      !this.aclService.forActor(actor).canDoAction(Action.Update, company)
    ) {
      throw new UnauthorizedException();
    }

    // Validate future dates
    if (dto.vipExpired) {
      const vip = new Date(dto.vipExpired);
      if (vip <= new Date()) {
        throw new BadRequestException(
          'VIP expiration date must be in the future',
        );
      }
    }
    if (dto.topJobExpired) {
      const top = new Date(dto.topJobExpired);
      if (top <= new Date()) {
        throw new BadRequestException(
          'Top company expiration date must be in the future',
        );
      }
    }

    Object.assign(company, dto);
    return this.companyRepo.save(company);
  }

  async delete(id: string, actor?: Actor) {
    const company = await this.companyRepo.findOne({
      where: { id },
      relations: ['users'],
    });

    if (!company) throw new NotFoundException('Company not found');

    if (
      actor &&
      !this.aclService.forActor(actor).canDoAction(Action.Delete, company)
    ) {
      throw new UnauthorizedException();
    }

    return this.companyRepo.remove(company);
  }

  async findByTaxCode(taxCode: string): Promise<Company | null> {
    return this.companyRepo.findOne({ where: { taxCode } });
  }

  async getStatsByCompanyId(
    companyId: string,
  ): Promise<{ totalJobs: number; totalApplications: number }> {
    // Ensure company exists (optional but helpful for 404s)
    const companyExists = await this.companyRepo.exist({
      where: { id: companyId },
    });
    if (!companyExists) {
      throw new NotFoundException('Company not found');
    }

    const [totalJobs, totalApplications] = await Promise.all([
      this.jobRepo.count({ where: { company: { id: companyId } } }),
      this.applicationRepo
        .createQueryBuilder('app')
        .leftJoin('app.job', 'job')
        .leftJoin('job.company', 'company')
        .where('company.id = :companyId', { companyId })
        .getCount(),
    ]);

    return { totalJobs, totalApplications };
  }

  async getDetailedStatsByCompanyId(companyId: string): Promise<{
    totalJobs: number;
    totalApplications: number;
    jobs: {
      byStatus: {
        open: number;
        closed: number;
        active: number;
        expired: number;
      };
      lastMonth: number;
      byCategory: Array<{ categoryId: string; name: string; count: number }>;
    };
    applications: {
      byStatus: Array<{ status: string; count: number }>;
      lastMonth: number;
      today: number;
    };
  }> {
    const companyExists = await this.companyRepo.exist({
      where: { id: companyId },
    });
    if (!companyExists) {
      throw new NotFoundException('Company not found');
    }

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
      999,
    );

    // Job stats
    const [
      openJobs,
      closedJobs,
      activeJobs,
      expiredJobs,
      jobsLastMonth,
      jobsByCategory,
    ] = await Promise.all([
      this.jobRepo
        .createQueryBuilder('job')
        .leftJoin('job.company', 'company')
        .where('company.id = :companyId', { companyId })
        .andWhere('job.status = :status', { status: 'OPEN' })
        .getCount(),
      this.jobRepo
        .createQueryBuilder('job')
        .leftJoin('job.company', 'company')
        .where('company.id = :companyId', { companyId })
        .andWhere('job.status = :status', { status: 'CLOSED' })
        .getCount(),
      // Active: OPEN and deadline in the future
      this.jobRepo
        .createQueryBuilder('job')
        .leftJoin('job.company', 'company')
        .where('company.id = :companyId', { companyId })
        .andWhere('job.status = :status', { status: 'OPEN' })
        .andWhere('job.deadline >= :now', { now })
        .getCount(),
      // Expired: OPEN but past deadline
      this.jobRepo
        .createQueryBuilder('job')
        .leftJoin('job.company', 'company')
        .where('company.id = :companyId', { companyId })
        .andWhere('job.status = :status', { status: 'OPEN' })
        .andWhere('job.deadline < :now', { now })
        .getCount(),
      // Jobs created last calendar month
      this.jobRepo
        .createQueryBuilder('job')
        .leftJoin('job.company', 'company')
        .where('company.id = :companyId', { companyId })
        .andWhere('job.createdAt BETWEEN :start AND :end', {
          start: startOfLastMonth,
          end: endOfLastMonth,
        })
        .getCount(),
      // Category distribution
      this.jobRepo
        .createQueryBuilder('job')
        .leftJoin('job.company', 'company')
        .leftJoin('job.category', 'category')
        .where('company.id = :companyId', { companyId })
        .select('category.id', 'categoryId')
        .addSelect('category.name', 'name')
        .addSelect('COUNT(job.id)', 'count')
        .groupBy('category.id')
        .addGroupBy('category.name')
        .getRawMany<{ categoryId: string; name: string; count: string }>()
        .then((rows) =>
          rows.map((r) => ({
            categoryId: String(r.categoryId),
            name: r.name,
            count: parseInt(r.count, 10),
          })),
        ),
    ]);

    // Application stats
    const [
      applicationsByStatus,
      applicationsLastMonth,
      applicationsToday,
      totalApplications,
    ] = await Promise.all([
      this.applicationRepo
        .createQueryBuilder('app')
        .leftJoin('app.job', 'job')
        .leftJoin('job.company', 'company')
        .where('company.id = :companyId', { companyId })
        .select('app.status', 'status')
        .addSelect('COUNT(app.id)', 'count')
        .groupBy('app.status')
        .getRawMany<{ status: string; count: string }>()
        .then((rows) =>
          rows.map((r) => ({ status: r.status, count: parseInt(r.count, 10) })),
        ),
      this.applicationRepo
        .createQueryBuilder('app')
        .leftJoin('app.job', 'job')
        .leftJoin('job.company', 'company')
        .where('company.id = :companyId', { companyId })
        .andWhere('app.applied_at BETWEEN :start AND :end', {
          start: startOfLastMonth,
          end: endOfLastMonth,
        })
        .getCount(),
      this.applicationRepo
        .createQueryBuilder('app')
        .leftJoin('app.job', 'job')
        .leftJoin('job.company', 'company')
        .where('company.id = :companyId', { companyId })
        .andWhere('app.applied_at >= :startOfToday', { startOfToday })
        .getCount(),
      this.applicationRepo
        .createQueryBuilder('app')
        .leftJoin('app.job', 'job')
        .leftJoin('job.company', 'company')
        .where('company.id = :companyId', { companyId })
        .getCount(),
    ]);

    return {
      totalJobs: openJobs + closedJobs,
      totalApplications,
      jobs: {
        byStatus: {
          open: openJobs,
          closed: closedJobs,
          active: activeJobs,
          expired: expiredJobs,
        },
        lastMonth: jobsLastMonth,
        byCategory: jobsByCategory,
      },
      applications: {
        byStatus: applicationsByStatus,
        lastMonth: applicationsLastMonth,
        today: applicationsToday,
      },
    };
  }
}
