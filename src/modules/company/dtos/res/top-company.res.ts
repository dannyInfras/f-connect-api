import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class TopCompanyResponseDto {
  @ApiProperty({
    example: '1',
    description: 'ID của công ty',
  })
  @Expose()
  id: string;

  @ApiProperty({
    example: 'FPT Software',
    description: 'Tên công ty',
  })
  @Expose()
  companyName: string;

  @ApiProperty({
    example: '1999-01-13T00:00:00.000Z',
    description: 'Ngày thành lập công ty',
    nullable: true,
  })
  @Expose()
  foundedAt: Date | null;

  @ApiProperty({
    example: 500,
    description: 'Số lượng nhân viên',
    nullable: true,
  })
  @Expose()
  employees: number | null;

  @ApiProperty({
    example: ['123 Nguyen Hue, District 1, Ho Chi Minh City'],
    description: 'Địa chỉ công ty',
    type: [String],
    nullable: true,
  })
  @Expose()
  address: string[] | null;

  @ApiProperty({
    example: 'https://fpt-software.com',
    description: 'Website công ty',
    nullable: true,
  })
  @Expose()
  website: string | null;

  @ApiProperty({
    example: 'Technology',
    description: 'Ngành nghề',
    nullable: true,
  })
  @Expose()
  industry: string | null;

  @ApiProperty({
    example: 'https://example.com/logo.png',
    description: 'URL logo công ty',
    nullable: true,
  })
  @Expose()
  logoUrl: string | null;

  static example: TopCompanyResponseDto = {
    id: '1',
    companyName: 'FPT Software',
    foundedAt: new Date('1999-01-13'),
    employees: 500,
    address: ['123 Nguyen Hue, District 1, Ho Chi Minh City'],
    website: 'https://fpt-software.com',
    industry: 'Technology',
    logoUrl: 'https://example.com/logo.png',
  };
}
