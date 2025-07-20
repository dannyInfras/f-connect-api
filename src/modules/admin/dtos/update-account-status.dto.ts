import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

/**
 * DTO for updating user account status by admin
 */
export class UpdateAccountStatusDto {
  @ApiProperty({
    description: 'Whether the user account should be disabled',
    example: false,
  })
  @IsBoolean()
  @IsNotEmpty()
  isAccountDisabled: boolean;
}
