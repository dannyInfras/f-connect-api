import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class TaxCodeReportDto {
  @IsNotEmpty()
  @IsString()
  taxCode: string;

  @IsNotEmpty()
  @IsString()
  companyName: string;

  @IsEmail()
  userEmail: string;

  @IsNotEmpty()
  @IsString()
  contactPhone: string;

  @IsString()
  additionalInfo: string;

  @IsString()
  reportType: string;

  @IsString()
  timestamp: string;
}
