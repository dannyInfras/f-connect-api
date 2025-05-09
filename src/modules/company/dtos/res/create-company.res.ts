// src/modules/company/dtos/res/create-company.res.ts
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CreateCompanyResDto {
  @ApiProperty({ example: 'abc123', description: 'Unique ID of the company' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'OpenAI', description: 'Name of the company' })
  @Expose()
  companyName: string;

  @ApiProperty({ example: '123456789', description: 'Company tax code' })
  @Expose()
  taxCode: string;

  @ApiProperty({ example: 'Technology', required: false })
  @Expose()
  industry?: string;

  @ApiProperty({ example: 'AI Research Company', required: false })
  @Expose()
  description?: string;

  @ApiProperty({ example: 'https://logo.url/openai.png', required: false })
  @Expose()
  logoUrl?: string;

  @ApiProperty({ example: 'San Francisco, CA', required: false })
  @Expose()
  address?: string;

  @ApiProperty({ example: 'https://license.url/openai.pdf', required: false })
  @Expose()
  businessLicenseUrl?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @Expose()
  updatedAt: Date;

  // Dữ liệu mẫu tĩnh để tái sử dụng
  static example = {
    id: 'abc123',
    companyName: 'OpenAI',
    taxCode: '123456789',
    industry: 'Technology',
    description: 'AI Research Company',
    logoUrl: 'https://logo.url/openai.png',
    address: 'San Francisco, CA',
    businessLicenseUrl: 'https://license.url/openai.pdf',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  // Dữ liệu mẫu cho update
  static updateExample = {
    id: 'abc123',
    companyName: 'OpenAI Updated',
    taxCode: '123456789',
    industry: 'AI Technology',
    description: 'Updated AI Research Company',
    logoUrl: 'https://logo.url/openai.png',
    address: 'San Francisco, CA',
    businessLicenseUrl: 'https://license.url/openai.pdf',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  };
}
