import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class PackageOutput {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  name: string;

  @Expose()
  @ApiProperty()
  description: string;

  @Expose()
  @ApiProperty()
  price: number;

  @Expose()
  @ApiProperty()
  durationDays: number;

  @Expose()
  @ApiProperty()
  type: string;

  @Expose()
  @ApiProperty()
  createdAt: Date;
}
