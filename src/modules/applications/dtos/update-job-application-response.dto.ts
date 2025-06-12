import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UpdateJobApplicationResponseDto {
  @Expose()
  @ApiProperty({
    example: 'Application status updated successfully',
    description: 'Success message for application update',
  })
  message: string;

  @Expose()
  @ApiProperty({
    example: true,
    description: 'Indicates if the operation was successful',
  })
  success: boolean;
}
