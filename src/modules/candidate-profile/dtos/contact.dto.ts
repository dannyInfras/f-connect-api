import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class ContactDto {
  @Expose()
  @ApiProperty()
  @IsOptional()
  @IsString()
  email?: string;

  @Expose()
  @ApiProperty()
  @IsOptional()
  @IsString()
  phone?: string;

  @Expose()
  @ApiProperty({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];
}
