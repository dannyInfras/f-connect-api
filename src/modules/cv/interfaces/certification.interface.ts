import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class Certification {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  issuer: string;

  @IsString()
  @IsNotEmpty()
  issueDate: string;

  @IsString()
  @IsOptional()
  expiryDate: string;

  @IsString()
  @IsNotEmpty()
  credentialId: string;

  @IsString()
  @IsOptional()
  credentialUrl: string;
} 
