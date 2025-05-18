import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { EmploymentTypeEnum } from '../enums/employee-type';

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

  @ApiProperty({ required: false, example: 'Full Time' })
  @IsOptional()
  @IsEnum(EmploymentTypeEnum)
  employmentType?: EmploymentTypeEnum;

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
