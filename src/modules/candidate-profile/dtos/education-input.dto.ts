import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class EducationInputDto {
  @ApiProperty({ example: 'University of California' })
  @IsNotEmpty()
  @IsString()
  institution: string;

  @ApiProperty({ required: false, example: "Bachelor's" })
  @IsOptional()
  @IsString()
  degree?: string;

  @ApiProperty({ required: false, example: 'Computer Science' })
  @IsOptional()
  @IsString()
  field?: string;

  @ApiProperty({ example: 2020 })
  @IsNotEmpty()
  @IsNumber()
  startYear: number;

  @ApiProperty({ required: false, example: 2024, nullable: true })
  @IsOptional()
  @IsNumber()
  endYear?: number | null;

  @ApiProperty({
    required: false,
    example: 'Focused on machine learning and distributed systems.',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
