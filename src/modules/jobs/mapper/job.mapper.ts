import { JobDetailResponseDto } from '@/modules/jobs/dtos/res/job.res';
import { JobResponseDto } from '@/modules/jobs/dtos/res/list-job.res';

import { Job } from '../entities/jobs.entity';

export class JobMapper {
  public static toResponse(job: Job): JobDetailResponseDto {
    return {
      id: job.id,
      title: job.title,
      category: {
        id: job.category.id,
        name: job.category.name,
      },
      company: {
        id: job.company.id,
        companyName: job.company.companyName,
        logoUrl: job.company.logoUrl,
        address: job.company.address,
      },
      typeOfEmployment: job.typeOfEmployment,
      responsibility: job.responsibility,
      jobFitAttributes: job.jobFitAttributes,
      niceToHave: job.niceToHave,
      deadline: job.deadline,
      description: job.description,
      location: job.location,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      experienceYears: job.experienceYears,
      status: job.status,
      isVip: job.isVip,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }

  public static toListJobResponse(job: Job): JobResponseDto {
    return {
      id: job.id,
      title: job.title,
      category: {
        id: job.category.id,
        name: job.category.name,
      },
      company: {
        id: job.company.id,
        companyName: job.company.companyName,
        logoUrl: job.company.logoUrl,
      },
      location: job.location,
      status: job.status,
      typeOfEmployment: job.typeOfEmployment,
      isVip: job.isVip,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }
}
