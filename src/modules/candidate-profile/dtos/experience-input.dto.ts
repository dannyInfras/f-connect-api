import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class ExperienceInputDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  position: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string | null;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  candidateProfileId: string;

  // @ApiProperty()
  // @IsNotEmpty()
  // @IsString()
  // companyId: string;
}
