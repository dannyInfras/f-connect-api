import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginInput {
  @IsNotEmpty()
  @ApiProperty()
  @IsString()
  @IsEmail()
  @MaxLength(200)
  email: string;

  @IsNotEmpty()
  @ApiProperty()
  @IsString()
  password: string;
}
