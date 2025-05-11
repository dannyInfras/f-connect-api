import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { ContactDto } from './contact.dto';
// import { EducationDto } from './education.dto';
// import { ExperienceDto } from './experience.dto';
// import { PortfolioDto } from './portfolio.dto';
import { SkillDto } from './skill.dto';
import { SocialDto } from './social.dto';

export class CandidateProfileResponseDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  name: string;

  @Expose()
  @ApiProperty()
  title: string;

  @Expose()
  @ApiProperty()
  company: string;

  @Expose()
  @ApiProperty()
  location: string;

  @Expose()
  @ApiProperty()
  avatar: string;

  @Expose()
  @ApiProperty()
  coverImage: string;

  @Expose()
  @ApiProperty()
  isOpenToOpportunities: boolean;

  @Expose()
  @ApiProperty()
  about: string;

  @Expose()
  @ApiProperty({ type: ContactDto })
  @Type(() => ContactDto)
  contact: ContactDto;

  @Expose()
  @ApiProperty({ type: SocialDto })
  @Type(() => SocialDto)
  social: SocialDto;

  // @Expose()
  // @ApiProperty({ type: [ExperienceDto] })
  // @Type(() => ExperienceDto)
  // experiences: ExperienceDto[];

  // @Expose()
  // @ApiProperty({ type: [EducationDto] })
  // @Type(() => EducationDto)
  // education: EducationDto[];

  @Expose()
  @ApiProperty({ type: [SkillDto] })
  @Type(() => SkillDto)
  skills: SkillDto[];

  // @Expose()
  // @ApiProperty({ type: [PortfolioDto] })
  // @Type(() => PortfolioDto)
  // portfolios: PortfolioDto[];

  @Expose()
  @ApiProperty()
  birthDate: string;
}
