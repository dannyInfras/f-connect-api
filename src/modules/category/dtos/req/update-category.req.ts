import { PartialType } from '@nestjs/mapped-types';

import { CreateCategoryReqDto } from './create-category.req';

export class UpdateCategoryDto extends PartialType(CreateCategoryReqDto) {}
