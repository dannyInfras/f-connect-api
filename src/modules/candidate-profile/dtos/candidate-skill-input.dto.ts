import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CandidateSkillInputDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  candidateProfileId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  skillId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  proficiencyLevel?: string;
}
