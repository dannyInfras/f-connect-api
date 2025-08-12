import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AdminCompanyOutput {
  @ApiProperty({ example: '123', description: 'Company ID' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'OpenAI', description: 'Company name' })
  @Expose()
  companyName: string;

  @ApiProperty({ example: '123456789', description: 'Tax code' })
  @Expose()
  taxCode: string;

  @ApiProperty({ example: 'contact@company.com' })
  @Expose()
  email: string | null;

  @ApiProperty({ example: false, description: 'Verification status' })
  @Expose()
  isVerified: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ example: '2024-01-02T00:00:00.000Z' })
  @Expose()
  updatedAt: Date;
}
