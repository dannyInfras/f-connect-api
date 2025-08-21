import { JobDetailResponseDto } from '@/modules/jobs/dtos/res/job.res';
import { JobResponseDto } from '@/modules/jobs/dtos/res/list-job.res';
import { TopJobResponseDto } from '@/modules/jobs/dtos/res/top-job.res';

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
      skills:
        job.skills?.map((skill) => ({
          id: skill.id,
          name: skill.name,
        })) || [],
      typeOfEmployment: job.typeOfEmployment,
      benefit: job.benefit,
      deadline: job.deadline,
      description: job.description,
      location: job.location,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      experienceYears: job.experienceYears,
      status: job.status,
      vipExpired: job.vipExpired,
      priorityPosition: job.priorityPosition,
      isDeleted: job.isDeleted || false,
      topJob: job.topJob || 0,
      topJobExpired: job.topJobExpired,
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
      skills:
        job.skills?.map((skill) => ({
          id: skill.id,
          name: skill.name,
        })) || [],
      location: job.location,
      status: job.status,
      typeOfEmployment: job.typeOfEmployment,
      vipExpired: job.vipExpired,
      priorityPosition: job.priorityPosition,
      isDeleted: job.isDeleted || false,
      topJob: job.topJob || 0,
      topJobExpired: job.topJobExpired,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }

  public static toTopJobResponse(job: Job): TopJobResponseDto {
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
      skills:
        job.skills?.map((skill) => ({
          id: skill.id,
          name: skill.name,
        })) || [],
      description: job.description,
      location: job.location,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      experienceYears: job.experienceYears,
      typeOfEmployment: job.typeOfEmployment,
      deadline: job.deadline,
      isDeleted: job.isDeleted || false,
      topJob: job.topJob || 0,
      topJobExpired: job.topJobExpired,
    };
  }
}
