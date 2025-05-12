import { plainToInstance } from 'class-transformer';

import { CompanyDetailResponseDto } from '../dtos/res/company-detail.res';
import { Company } from '../entities/company.entity';

export class CompanyMapper {
  public static toDetailResponse(company: Company): CompanyDetailResponseDto {
    return plainToInstance(
      CompanyDetailResponseDto,
      {
        ...company,
        coreTeam: company.coreTeam?.map((member) => ({
          id: member.id,
          name: member.name,
          position: member.position,
          imageUrl: member.imageUrl,
        })),
        benefits: company.benefits?.map((benefit) => ({
          id: benefit.id,
          name: benefit.name,
          description: benefit.description,
          iconUrl: benefit.iconUrl,
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
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
        })),
      },
      { excludeExtraneousValues: true },
    );
  }
}
