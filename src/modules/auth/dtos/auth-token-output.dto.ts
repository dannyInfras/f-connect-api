import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import { ROLE } from '@/modules/auth/constants/role.constant';

export class AuthTokenOutput {
  @Expose()
  @ApiProperty()
  accessToken: string;

  @Expose()
  @ApiProperty()
  refreshToken: string;
}

export class UserAccessTokenClaims {
  @Expose()
  id: number;
  @Expose()
  email: string;
  @Expose()
  roles: ROLE[];
  @Expose()
  companyId?: string | null;
}

export class UserRefreshTokenClaims {
  id: number;
}
