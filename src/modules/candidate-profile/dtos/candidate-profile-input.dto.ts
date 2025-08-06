import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { ContactDto } from './contact.dto';
import { SkillDataDto } from './skill-data.dto';
import { SocialDto } from './social.dto';

export class CandidateProfileInputDto {
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
  @IsOptional()
  @ValidateNested()
  @Type(() => ContactDto)
  contact?: ContactDto;

  @ApiProperty({ type: SocialDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SocialDto)
  social?: SocialDto;

  @ApiProperty({ type: [SkillDataDto] })
  @ValidateNested({ each: true })
  @Type(() => SkillDataDto)
  @IsArray()
  @IsOptional()
  skills?: SkillDataDto[];

  // @ApiProperty({ type: [PortfolioDto] })
  // @ValidateNested({ each: true })
  // @Type(() => PortfolioDto)
  // @IsArray()
  // @IsOptional()
  // portfolios?: PortfolioDto[];

  @ApiProperty()
  @IsOptional()
  @IsString()
  birthDate?: string;
}
