import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateJobReqDto {
  @ApiProperty({ example: 'Senior Software Engineer' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'We are looking for a senior software engineer...' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ example: '1', description: 'The ID of the category' })
  @IsNotEmpty()
  @IsString()
  categoryId: string;

  @ApiProperty({ example: '1', description: 'The ID of the category' })
  @IsNotEmpty()
  @IsString()
  companyId: string;

  @ApiProperty({
    example: ['1', '2', '3'],
    description: 'Array of skill IDs',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  skillIds: string[];

  @ApiProperty({
    example: ['Develop web applications', 'Write clean code'],
    description: 'Job responsibilities',
    type: [String],
  })
  @IsNotEmpty()
  @IsString({ each: true })
  responsibility: string[];

  @ApiProperty({
    example: [
      'You get energy from people and building the ideal work environment',
      'You have a sense for beautiful spaces and office experiences',
    ],
    description: 'Job fit attributes',
    type: [String],
  })
  @IsNotEmpty()
  @IsString({ each: true })
  jobFitAttributes: string[];

  @ApiProperty({
    example: ['Fluent in English', 'Project management skills'],
    description: 'niceToHave',
    type: [String],
  })
  @IsNotEmpty()
  @IsString({ each: true })
  niceToHave: string[];

  @ApiProperty({
    example: ['Health insurance', 'Gym membership'],
    description: 'benefit',
    type: [String],
  })
  @IsNotEmpty()
  @IsString({ each: true })
  benefit: string[];

  @ApiProperty({ example: 'New York', required: true })
  @IsNotEmpty()
  location: string;

  @ApiProperty({ example: 80000, required: true })
  @IsNotEmpty()
  salaryMin: number;

  @ApiProperty({ example: 120000, required: true })
  @IsNotEmpty()
  salaryMax: number;

  @ApiProperty({ example: 5, required: true })
  @IsNotEmpty()
  experienceYears: number;

  @ApiProperty({ example: true, required: true })
  isVip: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', required: true })
  @IsNotEmpty()
  deadline: Date;

  @ApiProperty({ example: 'FullTime', required: true })
  @IsNotEmpty()
  typeOfEmployment: string;
}
