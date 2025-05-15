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
  @ApiProperty({ nullable: true })
  degree: string;

  @Expose()
  @ApiProperty({ nullable: true })
  field: string;

  @Expose()
  @ApiProperty()
  startYear: number;

  @Expose()
  @ApiProperty({ nullable: true })
  endYear: number | null;

  @Expose()
  @ApiProperty({ nullable: true })
  description: string;

  @Expose()
  @ApiProperty()
  createdAt: Date;

  @Expose()
  @ApiProperty()
  updatedAt: Date;
}
