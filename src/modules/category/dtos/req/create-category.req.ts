import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCategoryReqDto {
  @ApiProperty({ example: 'Software Development' })
  @IsNotEmpty()
  @IsString()
  name: string;

  static example = {
    name: 'Software Development',
  };
}
