import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class CandidateUserDto {
  @Expose()
  @ApiProperty({ type: String })
  name: string;

  @Expose()
  @ApiProperty({ type: String, nullable: true })
  avatar?: string;
}

export class CandidateInfoDto {
  @Expose()
  @ApiProperty({ type: String })
  id: string;

  @Expose()
  @ApiProperty({ type: String, nullable: true })
  title?: string;

  @Expose()
  @ApiProperty({ type: String, nullable: true })
  location?: string;

  @Expose()
  @ApiProperty({ type: Boolean })
  isOpenToOpportunities: boolean;

  @Expose()
  @Type(() => CandidateUserDto)
  user?: CandidateUserDto;
}

export class CandidateBookmarkResponseDto {
  @Expose()
  @ApiProperty({ type: String })
  id: string;

  @Expose()
  @ApiProperty({ type: String })
  companyId: string;

  @Expose()
  @ApiProperty({ type: String })
  candidateProfileId: string;

  @Expose()
  @ApiProperty({ type: Date })
  createdAt: Date;

  @Expose()
  @Type(() => CandidateInfoDto)
  candidateProfile?: CandidateInfoDto;
}

export class ToggleCandidateBookmarkResponseDto {
  @Expose()
  bookmarked: boolean;

  @Expose()
  message: string;
}
