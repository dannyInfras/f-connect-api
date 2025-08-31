import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class HideJobDto {
  @ApiProperty({
    description: 'ID of the job to hide (soft delete)',
    example: '123456789',
  })
  @IsNotEmpty()
  @IsString()
  jobId: string;

  @ApiPropertyOptional({
    description: 'Optional reason for hiding the job',
    example: 'Reported multiple times for being misleading',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  static readonly example = {
    jobId: '123456789',
    reason: 'Reported multiple times for being misleading',
  };
}
