import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CategoryResponseDto {
  @Expose()
  @ApiProperty({ example: '1' })
  id: string;

  @Expose()
  @ApiProperty({ example: 'Software Development' })
  name: string;

  @Expose()
  @ApiProperty({ example: '2025-05-09T17:39:58.053Z' })
  createdAt: Date;

  static example = {
    id: '1',
    name: 'Software Development',
    createdAt: '2025-05-09T17:39:58.053Z',
  };
}
