import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import { ROLE } from '@/modules/auth/constants/role.constant';

/**
 * Admin user output DTO with comprehensive user information
 * Includes sensitive fields that only admins should see
 */
export class AdminUserOutput {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  name: string;

  @Expose()
  @ApiProperty()
  username: string;

  @Expose()
  @ApiProperty()
  email: string;

  @Expose()
  @ApiProperty({ example: [ROLE.USER] })
  roles: ROLE[];

  @Expose()
  @ApiProperty({ description: 'Whether the user account is disabled' })
  isAccountDisabled: boolean;

  @Expose()
  @ApiProperty({
    enum: ['local', 'google'],
    description: 'Authentication provider used by the user',
  })
  provider: 'local' | 'google';

  @Expose()
  @ApiProperty({ required: false })
  googleId?: string;

  @Expose()
  @ApiProperty({
    enum: ['MALE', 'FEMALE', 'OTHER'],
    required: false,
  })
  gender?: 'MALE' | 'FEMALE' | 'OTHER';

  @Expose()
  @ApiProperty({ required: false })
  phone?: string;

  @Expose()
  @ApiProperty({ required: false })
  avatar?: string;

  @Expose()
  @ApiProperty({ required: false })
  dob?: Date;

  @Expose()
  @ApiProperty({ description: 'Account creation date' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ description: 'Last account update date' })
  updatedAt: Date;

  @Expose()
  @ApiProperty({
    type: String,
    nullable: true,
    description: 'Associated company ID if user belongs to a company',
  })
  companyId?: string | null;
}
