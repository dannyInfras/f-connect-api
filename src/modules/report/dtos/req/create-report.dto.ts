import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateReportDto {
  @ApiProperty({
    description: 'Brief title describing the issue with the job posting',
    example: 'Misleading job requirements',
    maxLength: 255,
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description:
      'Detailed description explaining why this job is being reported',
    example:
      'This job posting requires 10+ years of experience for an entry-level position. The salary range is also unrealistic for the market rate and the job description contains discriminatory language.',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    description: 'ID of the job being reported',
    example: '123456789',
  })
  @IsNotEmpty()
  @IsString()
  jobId: string;

  // Static example for Swagger documentation
  static readonly example = {
    title: 'Misleading job requirements',
    description:
      'This job posting requires 10+ years of experience for an entry-level position. The salary range is also unrealistic for the market rate and the job description contains discriminatory language.',
    jobId: '123456789',
  };

  // Common report examples for reference
  static readonly commonExamples = {
    fakeJob: {
      title: 'Suspicious job posting',
      description:
        "This job appears to be fake - the company doesn't exist and the contact information is invalid. No legitimate business address provided.",
      jobId: '123456789',
    },
    discrimination: {
      title: 'Discriminatory requirements',
      description:
        'The job posting contains age and gender discrimination requirements that violate employment laws. Specifically requires "young female candidates only".',
      jobId: '123456789',
    },
    unrealisticRequirements: {
      title: 'Unrealistic job requirements',
      description:
        'Requiring 15 years of experience in React (which was created in 2013) for a junior developer position. Clearly unrealistic expectations.',
      jobId: '123456789',
    },
    scamMLM: {
      title: 'Multi-level marketing scheme',
      description:
        'This job posting is actually advertising an MLM scheme disguised as a legitimate sales position. Requires upfront payment and recruitment of others.',
      jobId: '123456789',
    },
    falseSalary: {
      title: 'False salary information',
      description:
        'The advertised salary is "up to $10,000" but in reality it\'s commission-based with very low base pay and unrealistic targets.',
      jobId: '123456789',
    },
    inappropriate: {
      title: 'Inappropriate job content',
      description:
        'Job posting contains inappropriate or unprofessional language and requests personal information not related to the job.',
      jobId: '123456789',
    },
  };
}
