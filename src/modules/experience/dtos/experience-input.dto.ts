import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class ExperienceInputDto {
  @ApiProperty({ required: false, example: 'Company Name' })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiProperty({ example: 'Software Engineer' })
  @IsNotEmpty()
  @IsString()
  role: string;

  @ApiProperty({ required: false, example: 'Software Engineer' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, example: 'full_time' })
  @IsOptional()
  @IsString()
  employmentType?: string;

  @ApiProperty({ required: false, example: 'San Francisco' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ example: '2021-01-01' })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2021-01-01' })
  @IsOptional()
  @IsDateString()
  endDate?: string | null;
}
