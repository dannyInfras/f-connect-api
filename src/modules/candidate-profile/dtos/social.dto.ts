import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';

export class SocialDto {
  @Expose()
  @ApiProperty()
  @IsOptional()
  @IsString()
  instagram?: string;

  @Expose()
  @ApiProperty()
  @IsOptional()
  @IsString()
  twitter?: string;

  @Expose()
  @ApiProperty()
  @IsOptional()
  @IsString()
  website?: string;
}
