import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

import { CvResDto } from './cv.res';

class ExperienceSuggestion {
  @ApiProperty({ example: 0 })
  @IsNumber()
  index: number;

  @ApiProperty({ example: 'description' })
  @IsString()
  field: string;

  @ApiProperty({ example: 'Improved description text focusing on relevant skills...' })
  @IsString()
  suggestion: string;

  @ApiProperty({ 
    example: 'This highlights your relevant experience with the specific technologies mentioned in the job description.' 
  })
  @IsString()
  reason: string;
}

class EducationSuggestion {
  @ApiProperty({ example: 0 })
  @IsNumber()
  index: number;

  @ApiProperty({ example: 'description' })
  @IsString()
  field: string;

  @ApiProperty({ example: 'Enhanced education description highlighting relevant coursework...' })
  @IsString()
  suggestion: string;

  @ApiProperty({ 
    example: 'This connects your educational background to the specific requirements of the job position.' 
  })
  @IsString()
  reason: string;
}

class SummaryWithReason {
  @ApiProperty({
    example: 'Results-driven Frontend Developer with 5+ years of experience...',
  })
  @IsString()
  suggestion: string;

  @ApiProperty({
    example: 'This summary directly addresses the key requirements in the job description while highlighting your most relevant experience.',
  })
  @IsString()
  reason: string;
}

class SkillsWithReason {
  @ApiProperty({
    example: ['React', 'TypeScript', 'Redux', 'Responsive Design'],
  })
  @IsArray()
  @IsString({ each: true })
  suggestions: string[];

  @ApiProperty({
    example: 'These skills directly match the requirements mentioned in the job description and showcase your relevant technical expertise.',
  })
  @IsString()
  reason: string;
}

class CvSuggestions {
  @ApiProperty({
    description: 'Suggested professional summary text with explanation',
    type: SummaryWithReason,
  })
  @IsOptional()
  @IsObject()
  @Type(() => SummaryWithReason)
  summary?: SummaryWithReason;

  @ApiProperty({
    description: 'Suggested skills that match the job requirements with explanation',
    type: SkillsWithReason,
  })
  @IsOptional()
  @IsObject()
  @Type(() => SkillsWithReason)
  skills?: SkillsWithReason;

  @ApiProperty({
    example: [
      {
        index: 0,
        field: 'description',
        suggestion: 'Led development of responsive web applications using React...',
        reason: 'This highlights your leadership and technical skills that match the job requirements.'
      },
    ],
    description: 'Suggested improvements for experience descriptions with explanations',
  })
  @IsOptional()
  @IsArray()
  @Type(() => ExperienceSuggestion)
  experience?: ExperienceSuggestion[];

  @ApiProperty({
    example: [
      {
        index: 0,
        field: 'description',
        suggestion: 'Focused on web development and UI/UX design principles...',
        reason: 'This emphasizes educational background relevant to the position.'
      },
    ],
    description: 'Suggested improvements for education descriptions with explanations',
  })
  @IsOptional()
  @IsArray()
  @Type(() => EducationSuggestion)
  education?: EducationSuggestion[];
}

export class OptimizeCvResDto {
  @ApiProperty({
    description: 'The optimized CV object',
    type: CvResDto,
  })
  @IsObject()
  optimizedCv: CvResDto;

  @ApiProperty({
    description: 'AI-generated suggestions for CV improvement',
    type: CvSuggestions,
  })
  @IsObject()
  suggestions: CvSuggestions;
} 
