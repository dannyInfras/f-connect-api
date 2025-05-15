import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ExperienceDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  role: string;

  @Expose()
  @ApiProperty()
  company: string;

  @Expose()
  @ApiProperty()
  employmentType: string;

  @Expose()
  @ApiProperty()
  startDate: string;

  @Expose()
  @ApiProperty({ nullable: true })
  endDate: string | null;

  @Expose()
  @ApiProperty()
  location: string;

  @Expose()
  @ApiProperty()
  description: string;
}
