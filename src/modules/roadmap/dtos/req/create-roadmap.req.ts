import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber,IsOptional, IsString } from 'class-validator';

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

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsNumber()
  estimatedDuration?: number;

  @ApiPropertyOptional({ example: 'job123' })
  @IsOptional()
  @IsString()
  jobId?: string;
}
