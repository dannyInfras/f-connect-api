import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CoreTeamMemberResDto {
  @Expose()
  @ApiProperty({ example: '1' })
  id: string;

  @Expose()
  @ApiProperty({ example: 'John Doe' })
  name: string;

  @Expose()
  @ApiProperty({ example: 'CEO' })
  position: string;

  @Expose()
  @ApiProperty({ example: 'https://team.url/johndoe.png' })
  imageUrl: string;
}
