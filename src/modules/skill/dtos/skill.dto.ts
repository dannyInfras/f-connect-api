import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class SkillDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  name: string;

  @Expose()
  @ApiProperty()
  createdAt: Date;
}
