import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class PortfolioDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  title: string;

  @Expose()
  @ApiProperty()
  image: string;

  @Expose()
  @ApiProperty({ required: false })
  description?: string;

  @Expose()
  @ApiProperty({ required: false })
  link?: string;
}

export {};
