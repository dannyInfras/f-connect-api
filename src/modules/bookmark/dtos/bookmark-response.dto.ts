import { Expose, Type } from 'class-transformer';

import { User } from '@/modules/user/entities/user.entity';

export class BookmarkJobCompanyDto {
  @Expose()
  id: string;

  @Expose()
  companyName: string;

  @Expose()
  logoUrl: string;
}

export class BookmarkJobCategoryDto {
  @Expose()
  id: string;

  @Expose()
  name: string;
}

export class BookmarkJobDto {
  @Expose()
  id: string;

  @Expose()
  title: string;

  @Expose()
  deadline: Date;

  @Expose()
  location: string;

  @Expose()
  typeOfEmployment: string;

  @Expose()
  @Type(() => BookmarkJobCategoryDto)
  category?: BookmarkJobCategoryDto;

  @Expose()
  @Type(() => BookmarkJobCompanyDto)
  company?: BookmarkJobCompanyDto;
}

export class BookmarkResponseDto {
  @Expose()
  id: number;

  @Expose()
  userId: number;

  @Expose()
  jobId: string;

  @Expose()
  createdAt: Date;

  @Expose()
  @Type(() => User)
  user?: User;

  @Expose()
  @Type(() => BookmarkJobDto)
  job?: BookmarkJobDto;

  @Expose()
  isApply: boolean;
}

export class ToggleBookmarkResponseDto {
  @Expose()
  bookmarked: boolean;

  @Expose()
  message: string;
}

export class BookmarkCountResponseDto {
  @Expose()
  count: number;
}
