import { ApiProperty } from '@nestjs/swagger';

import { RoadmapSkillDto } from './roadmap-skill.dto';

export class RoadmapResDto {
  @ApiProperty({ example: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Backend Developer Roadmap' })
  title: string;

  @ApiProperty({ example: 'Learning path to become backend developer' })
  description: string;

  @ApiProperty({ example: 'My CV' })
  cvName: string;

  @ApiProperty({ example: 'Backend Developer' })
  jobTitle: string;

  @ApiProperty({ example: 0 })
  progress: number;

  @ApiProperty({ type: () => [RoadmapSkillDto] })
  skills: RoadmapSkillDto[];

  @ApiProperty({ example: 1 })
  userId: number;

  @ApiProperty({ example: 'uuid', required: false })
  cvId?: string;

  @ApiProperty({ example: 'job123', required: false })
  jobId?: string;

  @ApiProperty({ example: new Date().toISOString() })
  createdAt: Date;

  @ApiProperty({ example: new Date().toISOString() })
  updatedAt: Date;
} 