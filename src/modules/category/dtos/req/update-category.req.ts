import { PartialType } from '@nestjs/swagger';

import { CreateCategoryReqDto } from './create-category.req';

export class UpdateCategoryDto extends PartialType(CreateCategoryReqDto) {}
