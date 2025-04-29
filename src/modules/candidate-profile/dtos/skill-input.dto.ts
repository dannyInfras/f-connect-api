import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SkillInputDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;
}
