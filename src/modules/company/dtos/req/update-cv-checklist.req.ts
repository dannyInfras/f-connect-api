import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';

import { CreateCvChecklistReqDto } from './create-cv-checklist.req';

export class UpdateCvChecklistReqDto extends PartialType(
  CreateCvChecklistReqDto,
) {
  @ApiProperty({
    description: 'All fields are optional for updates',
  })
  readonly placeholder?: string;
}
