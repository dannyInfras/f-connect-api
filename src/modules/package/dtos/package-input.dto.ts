import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export enum PackageType {
  USER_VIP = 'USER_VIP',
  COMPANY_VIP = 'COMPANY_VIP',
  JOB_VIP = 'JOB_VIP',
}

export class CreatePackageInput {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  durationDays: number;

  @ApiProperty({ enum: PackageType })
  @IsNotEmpty()
  @IsEnum(PackageType)
  type: PackageType;
}

export class UpdatePackageInput {
  @ApiProperty()
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiProperty()
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  price?: number;

  @ApiProperty()
  @IsOptional()
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  durationDays?: number;

  @ApiProperty({ enum: PackageType })
  @IsOptional()
  @IsNotEmpty()
  @IsEnum(PackageType)
  type?: PackageType;
}
