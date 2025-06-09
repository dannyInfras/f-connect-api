import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { CvEducation, CvExperience } from '../../entities/cv.entity';
import { Certification } from '../../interfaces/certification.interface';

export class CreateCvReqDto {
  @ApiProperty({ example: 'Pham Nam Phuong' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'https://example.com/image.jpg' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ example: 'https://example.com/cv.pdf' })
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty({ example: '+1234567890' })
  @IsNotEmpty()
  phone: number;

  @ApiProperty({ example: 'https://www.linkedin.com/in/phamnampuong' })
  @IsOptional()
  @IsString()
  linkedin?: string;

  @ApiProperty({ example: 'https://github.com/phamnamphuong' })
  @IsOptional()
  @IsString()
  github?: string;

  @ApiProperty({ example: 'Senior Software Engineer CV' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'A brief summary of my professional experience...' })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiProperty({
    example: [
      {
        company: 'Tech Corp',
        role: 'Senior Developer',
        description: 'Led team of 5 developers...',
        employmentType: 'FULL_TIME',
        location: 'New York',
        startDate: '2020-01-01',
        endDate: '2023-01-01',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CvExperience) // Changed from Object to CvExperience
  experience?: CvExperience[];

  @ApiProperty({
    example: [
      {
        institution: 'University of Tech',
        degree: 'Bachelor',
        field: 'Computer Science',
        startYear: '2016',
        endYear: '2020',
        description: 'Major in Software Engineering',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CvEducation) // Changed from Object to CvEducation
  education?: CvEducation[];

  @ApiProperty({ example: ['JavaScript', 'TypeScript', 'Node.js'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiProperty({
    example: [
      {
        title: 'AWS Certified Developer',
        issuer: 'Amazon Web Services',
        issueDate: '2023-01-01',
        expiryDate: '2026-01-01',
        credentialId: 'AWS-123456',
        credentialUrl: 'https://aws.amazon.com/verification/123456',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Certification) // Changed from Object to Certification
  certifications?: Certification[];

  @ApiProperty({ example: ['English (Native)', 'Spanish (Intermediate)'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiProperty({ example: 1 })
  @IsOptional()
  @IsNumber()
  templateId?: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  userId: number;
}
