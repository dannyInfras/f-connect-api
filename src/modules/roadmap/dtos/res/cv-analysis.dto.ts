import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CVAnalysisDetailDto {
  @ApiProperty()
  score: number;

  @ApiProperty()
  feedback: string;

  @ApiPropertyOptional({ type: [String] })
  matching?: string[];

  @ApiPropertyOptional({ type: [String] })
  missing?: string[];
}

export class CVAnalysisOverallDto {
  @ApiProperty()
  summary: string;

  @ApiProperty({ type: [String] })
  nextSteps: string[];
}

export class CVAnalysisDto {
  @ApiProperty({ example: 75 })
  overallScore: number;

  @ApiProperty({
    example: 'mid',
    enum: ['entry', 'junior', 'mid', 'senior', 'expert'],
  })
  experienceLevel: 'entry' | 'junior' | 'mid' | 'senior' | 'expert';

  @ApiProperty({ type: [String] })
  strengths: string[];

  @ApiProperty({ type: [String] })
  weaknesses: string[];

  @ApiProperty({ type: [String] })
  skillGaps: string[];

  @ApiProperty({ type: [String] })
  recommendations: string[];

  @ApiProperty({ example: 70 })
  matchPercentage: number;

  @ApiProperty()
  detailedAnalysis: {
    experience: CVAnalysisDetailDto;
    skills: CVAnalysisDetailDto;
    education: CVAnalysisDetailDto;
    overall: CVAnalysisOverallDto;
  };
}
