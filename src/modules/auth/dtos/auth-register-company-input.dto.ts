import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

import { ROLE } from '@/modules/auth/constants/role.constant';

export class RegisterCompanyInput {
  @ApiProperty()
  @IsNotEmpty()
  @MaxLength(100)
  @IsString()
  name: string;

  @ApiProperty()
  @MaxLength(200)
  @IsString()
  username: string;

  @ApiProperty()
  @IsNotEmpty()
  @Length(6, 100)
  @IsString()
  password: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(100)
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  taxCode: string;

  @ApiProperty()
  @IsArray()
  @IsEnum(ROLE, { each: true })
  roles: ROLE[];

  @ApiProperty({ default: true })
  @IsBoolean()
  isAccountDisabled: boolean = true;
}
