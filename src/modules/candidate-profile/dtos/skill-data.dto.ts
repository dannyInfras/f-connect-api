import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SkillDataDto {
  @ApiProperty({ description: 'Skill name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Proficiency level', required: false })
  @IsOptional()
  @IsString()
  proficiencyLevel?: string;
}
