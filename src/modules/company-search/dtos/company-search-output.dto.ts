import { ApiProperty } from '@nestjs/swagger';

class CompanyListItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  companyName: string;

  @ApiProperty({ required: false })
  logoUrl?: string;

  @ApiProperty({ required: false })
  industry?: string;
}

class PaginationDto {
  @ApiProperty()
  currentPage: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  totalItems: number;

  @ApiProperty()
  itemsPerPage: number;

  @ApiProperty()
  hasNextPage: boolean;

  @ApiProperty()
  hasPreviousPage: boolean;
}

export class CompanySearchResponseDto {
  @ApiProperty({ type: [CompanyListItemDto] })
  data: CompanyListItemDto[];

  @ApiProperty({ type: PaginationDto })
  pagination: PaginationDto;
}
