import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RoadmapSubTaskDto {
  @ApiProperty({ example: 'subtask-1' })
  id: string;

  @ApiProperty({ example: 'Research and understand fundamentals' })
  title: string;

  @ApiPropertyOptional({ example: 'Study the basic concepts' })
  description?: string;

  @ApiProperty({ example: false })
  completed: boolean;

  @ApiProperty({ example: 1 })
  order: number;

  @ApiPropertyOptional({ example: 30 })
  estimatedMinutes?: number;

  @ApiPropertyOptional({ example: 'Can explain key concepts' })
  checkCriteria?: string;
}

export class RoadmapTaskDto {
  @ApiProperty({ example: 'task-1' })
  id: string;

  @ApiProperty({ example: 'Learn fundamentals' })
  title: string;

  @ApiProperty({ example: 'Study core concepts' })
  description: string;

  @ApiProperty({
    example: 'learn',
    enum: ['learn', 'practice', 'project', 'review', 'assessment'],
  })
  type: 'learn' | 'practice' | 'project' | 'review' | 'assessment';

  @ApiProperty({ example: 4 })
  estimatedHours: number;

  @ApiProperty({
    example: 'high',
    enum: ['critical', 'high', 'medium', 'low'],
  })
  priority: 'critical' | 'high' | 'medium' | 'low';

  @ApiProperty({ example: false })
  completed: boolean;

  @ApiProperty({ example: 1 })
  order: number;

  @ApiPropertyOptional({
    example: ['Start with basics', 'Practice regularly'],
    type: [String],
  })
  tips?: string[];

  @ApiProperty({ type: () => [RoadmapSubTaskDto] })
  subTasks: RoadmapSubTaskDto[];

  @ApiPropertyOptional({
    example: ['skill-1'],
    type: [String],
  })
  relatedSkills?: string[];
}

export class RoadmapSkillDto {
  @ApiProperty({ example: 'skill-1' })
  id: string;

  @ApiProperty({ example: 'Cloud Computing' })
  title: string;

  @ApiProperty({ example: 'Learn cloud technologies' })
  description: string;

  @ApiProperty({
    example: 'core',
    enum: ['fundamental', 'core', 'advanced', 'specialized'],
  })
  category: 'fundamental' | 'core' | 'advanced' | 'specialized';

  @ApiProperty({
    example: 'intermediate',
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
  })
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';

  @ApiProperty({ example: 40 })
  estimatedHours: number;

  @ApiPropertyOptional({
    example: ['skill-0'],
    type: [String],
  })
  prerequisites?: string[];

  @ApiProperty({ example: 0 })
  progress: number;

  @ApiProperty({ example: 1 })
  order: number;

  @ApiProperty({ example: 'Essential for your career transition' })
  reason: string;

  @ApiProperty({ type: () => [RoadmapTaskDto] })
  tasks: RoadmapTaskDto[];
}
