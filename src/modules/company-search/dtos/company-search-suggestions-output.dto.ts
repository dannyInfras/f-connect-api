import { ApiProperty } from '@nestjs/swagger';

export class CompanySuggestionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  logoUrl?: string;

  @ApiProperty({ required: false })
  industry?: string;
}

export class CompanySearchSuggestionsResponseDto {
  @ApiProperty({ type: [String] })
  keywords: string[];

  @ApiProperty({ type: [CompanySuggestionDto] })
  companies: CompanySuggestionDto[];
}
