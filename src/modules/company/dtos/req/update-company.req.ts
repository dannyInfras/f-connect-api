import { PartialType } from '@nestjs/mapped-types';

import { CreateCompanyReqDto } from './create-company.req';

export class UpdateCompanyDto extends PartialType(CreateCompanyReqDto) {
  static example = {
    companyName: 'OpenAI Updated',
    industry: 'AI Technology',
    description: 'Updated AI Research Company',
  };
}
