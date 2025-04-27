import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { ContactDto } from './contact.dto';
import { EducationDto } from './education.dto';
import { ExperienceDto } from './experience.dto';
import { PortfolioDto } from './portfolio.dto';
import { SocialDto } from './social.dto';

export class CandidateProfileInputDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  company?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  isOpenToOpportunities?: boolean;

  @ApiProperty()
  @IsOptional()
  @IsString()
  about?: string;

  @ApiProperty({ type: ContactDto })
  @ValidateNested()
  @Type(() => ContactDto)
  @IsOptional()
  contact?: ContactDto;

  @ApiProperty({ type: SocialDto })
  @ValidateNested()
  @Type(() => SocialDto)
  @IsOptional()
  social?: SocialDto;

  @ApiProperty({ type: [ExperienceDto] })
  @ValidateNested({ each: true })
  @Type(() => ExperienceDto)
  @IsArray()
  @IsOptional()
  experiences?: ExperienceDto[];

  @ApiProperty({ type: [EducationDto] })
  @ValidateNested({ each: true })
  @Type(() => EducationDto)
  @IsArray()
  @IsOptional()
  education?: EducationDto[];

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsOptional()
  skills?: string[];

  @ApiProperty({ type: [PortfolioDto] })
  @ValidateNested({ each: true })
  @Type(() => PortfolioDto)
  @IsArray()
  @IsOptional()
  portfolios?: PortfolioDto[];

  @ApiProperty()
  @IsOptional()
  @IsString()
  birthDate?: string;
}
