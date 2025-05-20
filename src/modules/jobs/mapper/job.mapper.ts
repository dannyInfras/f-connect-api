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
        // Take first address or join multiple addresses with comma
        address: Array.isArray(job.company.address)
          ? job.company.address[0] || ''
          : job.company.address || '',
      },
      skills: job.skills?.map(skill => ({
        id: skill.id,
        name: skill.name,
      })) || [],
      typeOfEmployment: job.typeOfEmployment,
      responsibility: job.responsibility,
      jobFitAttributes: job.jobFitAttributes,
      niceToHave: job.niceToHave,
      benefit: job.benefit,
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
      skills: job.skills?.map(skill => ({
        id: skill.id,
        name: skill.name,
      })) || [],
      location: job.location,
      status: job.status,
      typeOfEmployment: job.typeOfEmployment,
      isVip: job.isVip,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }
}
