import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  ValidateIf,
} from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password',
    example: 'current-Password123',
  })
  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @ApiProperty({
    description:
      'New password (must be 8-16 characters, include uppercase, lowercase, number)',
    example: 'new-Password123',
  })
  @IsNotEmpty()
  @IsString()
  @Length(8, 16)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[\S]{8,16}$/, {
    message:
      'Password must be between 8-16 characters and include at least one uppercase letter, one lowercase letter, and one number',
  })
  newPassword: string;

  @ApiProperty({
    description: 'Confirm new password (must match new password)',
    example: 'new-Password123',
  })
  @IsNotEmpty()
  @IsString()
  @ValidateIf((o) => o.newPassword !== undefined)
  @IsNotEmpty({ message: 'Password confirmation is required' })
  confirmPassword: string;
}
