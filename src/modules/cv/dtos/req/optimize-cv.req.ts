import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class OptimizeCvReqDto {
  @ApiProperty({
    example: '1',
  })
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @ApiProperty({
    example: 'Frontend Developer',
    description: 'The job title to optimize the CV for',
  })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiProperty({
    example:
      'We are looking for a skilled Frontend Developer with 3+ years of experience...',
    description: 'The full job description text to optimize the CV against',
  })
  @IsNotEmpty()
  @IsString()
  jobDescription: string;
}
