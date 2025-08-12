import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional,IsString } from 'class-validator';

export class GenerateQuizReqDto {
  @ApiProperty({ example: 'roadmap-uuid' })
  @IsNotEmpty()
  @IsString()
  roadmapId: string;

  @ApiProperty({ example: 'Practice Test for Frontend Development', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ example: 'Test your knowledge before starting the roadmap', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
