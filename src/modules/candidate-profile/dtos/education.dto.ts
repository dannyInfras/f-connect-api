import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class EducationDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  institution: string;

  @Expose()
  @ApiProperty()
  logo: string;

  @Expose()
  @ApiProperty()
  degree: string;

  @Expose()
  @ApiProperty()
  field: string;

  @Expose()
  @ApiProperty()
  startYear: number;

  @Expose()
  @ApiProperty()
  endYear: number;

  @Expose()
  @ApiProperty({ required: false })
  description?: string;
}
