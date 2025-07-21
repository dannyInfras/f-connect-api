import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateRoadmapReqDto {
  @ApiProperty({ example: 'Backend Dev Roadmap' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'Detailed roadmap description' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ example: 'Backend Developer' })
  @IsNotEmpty()
  @IsString()
  jobTitle: string;

  @ApiPropertyOptional({ example: 'uuid' })
  @IsOptional()
  @IsUUID()
  cvId?: string;

  @ApiPropertyOptional({ example: 'job123' })
  @IsOptional()
  @IsString()
  jobId?: string;
} 