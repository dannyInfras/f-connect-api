import { PartialType } from '@nestjs/swagger';

import { CreateCvReqDto } from './create-cv.req';

export class UpdateCvReqDto extends PartialType(CreateCvReqDto) {} 
