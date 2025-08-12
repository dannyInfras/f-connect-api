import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { Repository } from 'typeorm';

import { Company } from '@/modules/company/entities/company.entity';
import { UserService } from '@/modules/user/services/user.service';
import { Action } from '@/shared/acl/action.constant';
import { Actor } from '@/shared/acl/actor.constant';
import { AppLogger } from '@/shared/logger/logger.service';
import { MailService } from '@/shared/mail/mail.service';
import { RequestContext } from '@/shared/request-context/request-context.dto';

import { AdminCompaniesResponseDto } from '../dtos/admin-companies-response.dto';
import { AdminCompanyDetailOutput } from '../dtos/admin-company-detail-output.dto';
import { AdminCompanyOutput } from '../dtos/admin-company-output.dto';
import { AdminCompanyAclService } from './admin-company-acl.service';

@Injectable()
export class AdminCompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    private readonly userService: UserService,
    private readonly aclService: AdminCompanyAclService,
    private readonly mailService: MailService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(AdminCompanyService.name);
  }

  async listCompanies(
    ctx: RequestContext,
    admin: Actor,
    limit: number = 20,
    offset: number = 0,
    filters?: { isVerified?: boolean },
  ): Promise<AdminCompaniesResponseDto> {
    this.logger.log(ctx, `${this.listCompanies.name} was called`);

    if (!this.aclService.forActor(admin).canDoAction(Action.List)) {
      throw new UnauthorizedException(
        'Insufficient permissions to list companies',
      );
    }

    const where: any = {};
    if (typeof filters?.isVerified === 'boolean') {
      where.isVerified = filters.isVerified;
    }

    const [companies, count] = await this.companyRepo.findAndCount({
      where,
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
    });

    const outputs = plainToClass(AdminCompanyOutput, companies, {
      excludeExtraneousValues: true,
    });

    return { companies: outputs, count, limit, offset };
  }

  async getCompanyById(
    ctx: RequestContext,
    admin: Actor,
    companyId: string,
  ): Promise<AdminCompanyDetailOutput> {
    this.logger.log(ctx, `${this.getCompanyById.name} was called`);

    if (!this.aclService.forActor(admin).canDoAction(Action.Read)) {
      throw new UnauthorizedException(
        'Insufficient permissions to read company',
      );
    }

    const company = await this.companyRepo.findOne({
      where: { id: companyId },
      relations: ['users', 'benefits', 'coreTeam', 'jobs', 'jobs.category'],
    });
    if (!company) throw new NotFoundException('Company not found');

    const usersBrief = (company.users || []).map((u) => ({
      id: u.id,
      username: u.username,
      name: u.name,
      email: u.email,
      isAccountDisabled: u.isAccountDisabled,
    }));

    const detail: any = {
      ...company,
      coreTeam: company.coreTeam?.map((m) => ({
        id: m.id,
        name: m.name,
        position: m.position,
        imageUrl: m.imageUrl,
      })),
      benefits: company.benefits?.map((b) => ({
        id: b.id,
        name: b.name,
        description: b.description,
        iconUrl: b.iconUrl,
      })),
      openPositions: company.jobs?.map((job) => ({
        id: job.id,
        title: job.title,
        category: job.category
          ? { id: job.category.id, name: job.category.name }
          : null,
        location: job.location,
        typeOfEmployment: job.typeOfEmployment,
        status: job.status,
        isDeleted: job.isDeleted || false,
        topJob: job.topJob || 0,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      })),
      users: usersBrief,
    };

    return plainToClass(AdminCompanyDetailOutput, detail, {
      excludeExtraneousValues: true,
    });
  }

  async verifyCompany(
    ctx: RequestContext,
    admin: Actor,
    companyId: string,
  ): Promise<AdminCompanyOutput> {
    this.logger.log(ctx, `${this.verifyCompany.name} was called`);

    if (!this.aclService.forActor(admin).canDoAction(Action.Update)) {
      throw new UnauthorizedException(
        'Insufficient permissions to verify company',
      );
    }

    const company = await this.companyRepo.findOne({
      where: { id: companyId },
    });
    if (!company) throw new NotFoundException('Company not found');

    if (!company.isVerified) {
      company.isVerified = true;
      await this.companyRepo.save(company);

      // Enable all users under this company if they are disabled (optional business rule)
      const users = await this.userService.findUserByCompanyId(companyId);
      await Promise.all(
        users
          .filter((u) => u.isAccountDisabled)
          .map((u) => this.userService.verifyUser(ctx, u.id, false)),
      );

      // Send notifications via email (best-effort)
      const emailsToNotify = [
        ...(company.email ? [company.email] : []),
        ...users
          .map((u) => u.email)
          .filter((e): e is string => typeof e === 'string' && !!e),
      ];

      const uniqueEmails = Array.from(new Set(emailsToNotify));
      const subject = `Company Verification Approved: ${company.companyName}`;
      const dashboardUrl = `${process.env.FRONTEND_URL || ''}/company/dashboard`;

      await Promise.all(
        uniqueEmails.map(async (to) => {
          try {
            await this.mailService.sendMail(to, subject, 'company-verified', {
              companyName: company.companyName,
              dashboardUrl,
            });
          } catch (error: any) {
            this.logger.error(
              ctx,
              `Failed to send company verification email to ${to}: ${error?.message || error}`,
            );
          }
        }),
      );
    }

    return plainToClass(AdminCompanyOutput, company, {
      excludeExtraneousValues: true,
    });
  }

  async rejectCompany(
    ctx: RequestContext,
    admin: Actor,
    companyId: string,
  ): Promise<{ message: string }> {
    this.logger.log(ctx, `${this.rejectCompany.name} was called`);

    if (!this.aclService.forActor(admin).canDoAction(Action.Delete)) {
      throw new UnauthorizedException(
        'Insufficient permissions to reject company',
      );
    }

    const company = await this.companyRepo.findOne({
      where: { id: companyId },
    });
    if (!company) throw new NotFoundException('Company not found');

    if (company.isVerified) {
      throw new UnauthorizedException('Cannot reject a verified company');
    }

    // Optionally delete or keep record; here we delete the company and its first user (if exists)
    const users = await this.userService.findUserByCompanyId(companyId);
    if (users.length > 0) {
      await this.userService.deleteUser(users[0].id);
    }
    await this.companyRepo.remove(company);

    return { message: 'Company rejected and removed' };
  }
}
