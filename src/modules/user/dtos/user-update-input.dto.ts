import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

import { IsAdult } from '@/shared/validator/users';

import { CreateUserInput } from './user-create-input.dto';

export class UpdateUserInput extends PartialType(CreateUserInput) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty()
  @MaxLength(100)
  @IsString()
  @Matches(/^[A-Za-z]+(?:[ '\-][A-Za-z]+)*$/, {
    message: 'Invalid name',
  })
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty()
  @MaxLength(100)
  @IsEmail()
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty()
  @Length(6, 100)
  @IsString()
  @IsPhoneNumber()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  gender?: 'MALE' | 'FEMALE' | 'OTHER';

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  @IsAdult()
  dob?: Date;
}
