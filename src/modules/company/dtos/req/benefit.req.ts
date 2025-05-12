import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateBenefitDto {
  @ApiProperty({ example: 'Health Insurance' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Comprehensive health insurance for all employees.' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ example: 'https://icon.url/health.png' })
  @IsNotEmpty()
  @IsString()
  iconUrl: string;
}

export class UpdateBenefitDto extends CreateBenefitDto {}
