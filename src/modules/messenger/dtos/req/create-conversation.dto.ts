import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({
    description: 'The ID of the candidate user',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  candidateId: number;

  @ApiProperty({
    description: 'The ID of the company user',
    example: 2,
  })
  @IsNotEmpty()
  @IsNumber()
  companyId: number;
} 