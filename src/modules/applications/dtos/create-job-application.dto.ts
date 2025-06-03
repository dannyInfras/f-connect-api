import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateJobApplicationDto {
  @IsInt()
  @ApiProperty({ example: 1, description: 'The ID of the job to apply for' })
  jobId: number;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'https://example.com/cv.pdf',
    description: 'The ID of the CV to attach to the application (optional)',
    required: false,
  })
  cvId?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'Dear Hiring Manager, I am excited to apply for this position...',
    description: 'A cover letter for the job application (optional)',
    required: false,
  })
  coverLetter?: string;
}
