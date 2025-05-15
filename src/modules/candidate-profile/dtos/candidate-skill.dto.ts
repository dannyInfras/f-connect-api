import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { SkillDto } from '../../skill/dtos/skill.dto';

export class CandidateSkillDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty({ type: SkillDto })
  @Type(() => SkillDto)
  skill: SkillDto;

  @Expose()
  @ApiProperty({ required: false })
  proficiencyLevel?: string;

  @Expose()
  @ApiProperty()
  createdAt: Date;
}
