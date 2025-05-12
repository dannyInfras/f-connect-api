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

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @Expose()
  foundedAt: Date;

  @ApiProperty({ example: 100 })
  @Expose()
  employees: number;

  @ApiProperty({
    example: ['San Francisco, CA'],
    description: 'Company addresses',
    type: [String],
  })
  @Expose()
  address: string[];

  @ApiProperty({ example: 'https://company.com' })
  @Expose()
  website: string;

  @ApiProperty({ example: 'Technology', required: false })
  @Expose()
  industry?: string;

  @ApiProperty({ example: 'AI Research Company', required: false })
  @Expose()
  description?: string;

  @ApiProperty({ example: 'https://logo.url/openai.png', required: false })
  @Expose()
  logoUrl?: string;

  @ApiProperty({ example: ['twitter.com/company'] })
  @Expose()
  socialMedia: string[];

  @ApiProperty({ example: ['https://work-image.url/1.png'] })
  @Expose()
  workImageUrl: string[];

  @ApiProperty({ example: '123456789', description: 'Company tax code' })
  @Expose()
  taxCode: string;

  @ApiProperty({ example: 'https://license.url/doc.pdf', required: false })
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
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  // Dữ liệu mẫu cho update
  static updateExample = {
    id: 'abc123',
    companyName: 'OpenAI Updated',
    foundedAt: '2024-01-01T00:00:00.000Z',
    employees: 120,
    address: ['San Francisco, CA'],
    website: 'https://company.com',
    industry: 'AI Technology',
    description: 'Updated AI Research Company',
    logoUrl: 'https://logo.url/openai.png',
    socialMedia: ['twitter.com/company'],
    workImageUrl: ['https://work-image.url/1.png'],
    taxCode: '123456789',
    businessLicenseUrl: 'https://license.url/doc.pdf',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  };
}
