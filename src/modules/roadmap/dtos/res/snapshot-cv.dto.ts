import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CVExperienceDto {
  @ApiProperty()
  company: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  startDate: string;

  @ApiPropertyOptional()
  endDate?: string;

  @ApiPropertyOptional()
  duration?: string;
}

export class CVEducationDto {
  @ApiProperty()
  institution: string;

  @ApiProperty()
  degree: string;

  @ApiProperty()
  field: string;

  @ApiProperty()
  startYear: string;

  @ApiPropertyOptional()
  endYear?: string;
}

export class CVSnapshotDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  summary: string;

  @ApiProperty({ type: () => [CVExperienceDto] })
  experience: CVExperienceDto[];

  @ApiProperty({ type: () => [CVEducationDto] })
  education: CVEducationDto[];

  @ApiProperty({ type: [String] })
  skills: string[];

  @ApiPropertyOptional()
  certifications?: any[];

  @ApiPropertyOptional({ type: [String] })
  languages?: string[];

  @ApiPropertyOptional()
  totalExperience?: number;
}
