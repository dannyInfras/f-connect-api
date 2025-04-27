import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class ContactDto {
  @Expose()
  @ApiProperty()
  email: string;

  @Expose()
  @ApiProperty()
  phone: string;

  @Expose()
  @ApiProperty({ type: [String] })
  languages: string[];
}

export {};
