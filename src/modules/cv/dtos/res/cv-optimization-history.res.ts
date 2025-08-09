import { ApiProperty } from '@nestjs/swagger';

export class CvOptimizationHistoryResDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  cvId: string;

  @ApiProperty()
  jobTitle?: string;

  @ApiProperty()
  jobDescription?: string;

  @ApiProperty()
  suggestions: any;

  @ApiProperty()
  optimizedCv: any;

  @ApiProperty()
  isApplied: boolean;

  @ApiProperty()
  createdAt: Date;
}
