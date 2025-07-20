import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

import { AdminUserOutput } from './admin-user-output.dto';

/**
 * Response DTO for paginated admin user list
 */
export class AdminUsersResponseDto {
  @Expose()
  @ApiProperty({
    description: 'Array of users with admin-visible information',
    type: [AdminUserOutput],
  })
  @Type(() => AdminUserOutput)
  users: AdminUserOutput[];

  @Expose()
  @ApiProperty({
    description: 'Total number of users in the system',
    example: 150,
  })
  count: number;

  @Expose()
  @ApiProperty({
    description: 'Number of users returned in this response',
    example: 20,
  })
  limit: number;

  @Expose()
  @ApiProperty({
    description: 'Number of users skipped',
    example: 0,
  })
  offset: number;
}
