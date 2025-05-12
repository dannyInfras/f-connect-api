import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class BenefitResDto {
  @Expose()
  @ApiProperty({ example: 'benefit1' })
  id: string;

  @Expose()
  @ApiProperty({ example: 'Health Insurance' })
  name: string;

  @Expose()
  @ApiProperty({ example: 'Comprehensive health insurance for all employees.' })
  description: string;

  @Expose()
  @ApiProperty({ example: 'https://icon.url/health.png' })
  iconUrl: string;
}
