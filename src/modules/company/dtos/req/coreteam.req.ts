import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCoreTeamDto {
  @ApiProperty({ example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'CEO' })
  @IsNotEmpty()
  @IsString()
  position: string;

  @ApiProperty({ example: 'https://team.url/johndoe.png' })
  @IsNotEmpty()
  @IsString()
  imageUrl: string;
}

export class UpdateCoreTeamDto extends CreateCoreTeamDto {}
