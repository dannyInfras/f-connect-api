// src/modules/company/dtos/req/create-company.req.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class CreateCompanyReqDto {
  @ApiProperty({ example: 'OpenAI', description: 'Name of the company' })
  @IsNotEmpty()
  @IsString()
  companyName: string;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Company founding date',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  foundedAt?: Date;

  @ApiProperty({
    example: 100,
    description: 'Number of employees',
    required: false,
  })
  @IsOptional()
  @IsInt()
  employees?: number;

  @ApiProperty({
    example: ['San Francisco, CA'],
    description: 'Company addresses',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  address?: string[];

  @ApiProperty({ example: 'https://company.com', required: false })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiProperty({ example: 'Technology', required: false })
  @IsOptional()
  @IsString()
  industry?: string;

  @ApiProperty({ example: '0123456789', required: false })
  @IsOptional()
  @IsNumber()
  phone?: number;

  @ApiProperty({ example: 'example@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'AI Research Company', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'https://logo.url/openai.png', required: false })
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @ApiProperty({
    example: ['twitter.com/company'],
    description: 'Social media links',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  socialMedia?: string[];

  @ApiProperty({
    example: ['https://work-image.url/1.png'],
    description: 'Work environment images',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  workImageUrl?: string[];

  @ApiProperty({ example: '123456789', description: 'Company tax code' })
  @IsNotEmpty()
  @IsString()
  taxCode: string;

  @ApiProperty({ example: 'https://license.url/doc.pdf', required: false })
  @IsOptional()
  @IsUrl()
  businessLicenseUrl?: string;

  static example = {
    companyName: 'OpenAI',
    foundedAt: '2024-01-01T00:00:00.000Z',
    employees: 100,
    address: ['San Francisco, CA'],
    website: 'https://company.com',
    industry: 'Technology',
    description: 'AI Research Company',
    logoUrl: 'https://logo.url/openai.png',
    socialMedia: ['twitter.com/company'],
    workImageUrl: ['https://work-image.url/1.png'],
    taxCode: '123456789',
    businessLicenseUrl: 'https://license.url/doc.pdf',
  };
}
