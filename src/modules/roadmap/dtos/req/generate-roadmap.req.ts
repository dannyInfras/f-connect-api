import { ApiProperty } from '@nestjs/swagger';
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

  @ApiProperty({ example: 'Backend Developer', required: false })
  @IsOptional()
  @IsString()
  jobTitle?: string;
} 