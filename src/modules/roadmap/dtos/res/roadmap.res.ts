import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { CVAnalysisDto } from './cv-analysis.dto';
import { RoadmapSkillDto } from './roadmap-skill.dto';
import { CVSnapshotDto } from './snapshot-cv.dto';

export class RoadmapResDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Backend Developer Roadmap' })
  title: string;

  @ApiProperty({ example: 'Learning path to become backend developer' })
  description: string;

  @ApiProperty({ example: 'Backend Developer' })
  jobTitle: string;

  @ApiProperty({ example: 0 })
  progress: number;

  @ApiPropertyOptional({
    example: 12,
    description: 'Estimated duration in weeks',
  })
  estimatedDuration?: number;

  @ApiProperty({ type: () => [RoadmapSkillDto] })
  skills: RoadmapSkillDto[];

  @ApiPropertyOptional({ type: () => CVSnapshotDto })
  cvSnapshot?: CVSnapshotDto;

  @ApiPropertyOptional({ type: () => CVAnalysisDto })
  cvAnalysis?: CVAnalysisDto;

  @ApiProperty({ example: 1 })
  userId: number;

  @ApiPropertyOptional({ example: 'job123' })
  jobId?: string;

  @ApiProperty({ example: new Date().toISOString() })
  createdAt: Date;

  @ApiProperty({ example: new Date().toISOString() })
  updatedAt: Date;
}
