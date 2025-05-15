import { PartialType } from '@nestjs/swagger';

import { CandidateProfileInputDto } from './candidate-profile-input.dto';

/**
 * DTO for partial updates to candidate profiles
 */
export class UpdateCandidateProfileDto extends PartialType(
  CandidateProfileInputDto,
) {}
