import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

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

  @ApiProperty({ 
    example: 1, 
    description: 'Priority position (1-3, where 1 is highest priority)', 
    required: false,
    default: 3
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3)
  priorityPosition?: number;
}
