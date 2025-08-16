import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Password reset token from email',
    example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsNotEmpty()
  @IsString()
  token: string;

  @ApiProperty({
    description:
      'New password (must be 8-16 characters, include uppercase, lowercase, number)',
    example: 'NewPassword123',
  })
  @IsNotEmpty()
  @IsString()
  @Length(8, 16)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[\S]{8,16}$/, {
    message:
      'Password must be between 8-16 characters and include at least one uppercase letter, one lowercase letter, and one number',
  })
  newPassword: string;
}
