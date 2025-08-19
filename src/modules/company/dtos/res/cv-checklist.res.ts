import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class ChecklistItemResDto {
  @Expose()
  @ApiProperty({
    example: 'contact_info',
    description: 'Unique identifier for the checklist item',
  })
  id: string;

  @Expose()
  @ApiProperty({
    example: 'Contact info present & accurate',
    description: 'The checklist criterion description',
  })
  criterion: string;

  @Expose()
  @ApiProperty({
    example: 8,
    description: 'Weight/importance of this item (1-10)',
  })
  weight: number;

  @Expose()
  @ApiProperty({
    example: true,
    description: 'Whether this item is required or optional',
  })
  required: boolean;

  @Expose()
  @ApiProperty({
    example: 'Name, phone, email valid and professional',
    description: 'Additional notes or context for this criterion',
    required: false,
  })
  description?: string;
}

export class CvChecklistResDto {
  @Expose()
  @ApiProperty({
    example: 1,
    description: 'Unique identifier',
  })
  id: number;

  @Expose()
  @ApiProperty({
    example: 'Software Developer Checklist',
    description: 'Name of the CV checklist',
  })
  checklistName: string;

  @Expose()
  @ApiProperty({
    example: 'Custom checklist for software development positions',
    description: 'Description of the checklist purpose',
  })
  description: string;

  @Expose()
  @Type(() => ChecklistItemResDto)
  @ApiProperty({
    type: [ChecklistItemResDto],
    description: 'Array of checklist items',
  })
  checklistItems: ChecklistItemResDto[];

  @Expose()
  @ApiProperty({
    example: true,
    description: 'Whether this checklist is active',
  })
  isActive: boolean;

  @Expose()
  @ApiProperty({
    example: false,
    description: 'Whether this is the default checklist for the company',
  })
  isDefault: boolean;

  @Expose()
  @ApiProperty({
    example: '123',
    description: 'Company ID',
  })
  companyId: string;

  @Expose()
  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Creation timestamp',
  })
  createdAt: Date;

  @Expose()
  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Last update timestamp',
  })
  updatedAt: Date;
}
