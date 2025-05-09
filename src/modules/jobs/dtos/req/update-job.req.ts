import { PartialType } from '@nestjs/swagger';

import { CreateJobReqDto } from '../req/create-job.req';

export class UpdateJobDto extends PartialType(CreateJobReqDto) {}
