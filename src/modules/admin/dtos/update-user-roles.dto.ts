import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty } from 'class-validator';

import { ROLE } from '@/modules/auth/constants/role.constant';

/**
 * DTO for updating user roles by admin
 */
export class UpdateUserRolesDto {
  @ApiProperty({
    description: 'Array of roles to assign to the user',
    enum: ROLE,
    isArray: true,
    example: [ROLE.USER, ROLE.RECRUITER],
  })
  @IsArray()
  @IsNotEmpty()
  @IsEnum(ROLE, { each: true })
  roles: ROLE[];
}
