import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class GenerateRoadmapReqDto {
  @ApiProperty({ example: 'uuid-cv' })
  @IsNotEmpty()
  @IsUUID()
  cvId: string;

  @ApiProperty({ example: 'job123' })
  @IsNotEmpty()
  @IsString()
  jobId: string;

  @ApiPropertyOptional({ example: 'Backend Developer' })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiPropertyOptional({ example: 'Job description here' })
  @IsOptional()
  @IsString()
  jobDescription?: string;

  @ApiPropertyOptional({ example: 'Job requirements here' })
  @IsOptional()
  @IsString()
  jobRequirements?: string;
}
