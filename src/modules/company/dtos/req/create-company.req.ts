// src/modules/company/dtos/req/create-company.req.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCompanyReqDto {
  @ApiProperty({ example: 'OpenAI', description: 'Name of the company' })
  @IsNotEmpty()
  @IsString()
  companyName: string;

  @ApiProperty({ example: '123456789', description: 'Company tax code' })
  @IsNotEmpty()
  @IsString()
  taxCode: string;

  @ApiProperty({ example: 'Technology', required: false })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiProperty({ example: 'AI Research Company', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'https://logo.url/openai.png', required: false })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty({ example: 'San Francisco, CA', required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 'https://license.url/openai.pdf', required: false })
  @IsOptional()
  @IsString()
  businessLicenseUrl?: string;

  static example = {
    companyName: 'OpenAI',
    taxCode: '123456789',
    industry: 'Technology',
    description: 'AI Research Company',
    logoUrl: 'https://logo.url/openai.png',
    address: 'San Francisco, CA',
    businessLicenseUrl: 'https://license.url/openai.pdf',
  };
}
