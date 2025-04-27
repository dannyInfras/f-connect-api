import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class SocialDto {
  @Expose()
  @ApiProperty()
  instagram: string;

  @Expose()
  @ApiProperty()
  twitter: string;

  @Expose()
  @ApiProperty()
  website: string;
}

export {};
