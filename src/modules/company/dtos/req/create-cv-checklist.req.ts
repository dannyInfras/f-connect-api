import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class ChecklistItemReqDto {
  @ApiProperty({
    example: 'contact_info',
    description: 'Unique identifier for the checklist item',
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    example: 'Contact info present & accurate',
    description: 'The checklist criterion description',
  })
  @IsString()
  @IsNotEmpty()
  criterion: string;

  @ApiProperty({
    example: 8,
    description: 'Weight/importance of this item (1-10)',
    minimum: 1,
    maximum: 10,
  })
  @IsNumber()
  @Min(1)
  @Max(10)
  weight: number;

  @ApiProperty({
    example: true,
    description: 'Whether this item is required or optional',
  })
  @IsBoolean()
  required: boolean;

  @ApiProperty({
    example: 'Name, phone, email valid and professional',
    description: 'Additional notes or context for this criterion',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateCvChecklistReqDto {
  @ApiProperty({
    example: 'Software Developer Checklist',
    description: 'Name of the CV checklist',
  })
  @IsString()
  @IsNotEmpty()
  checklistName: string;

  @ApiProperty({
    example: 'Custom checklist for software development positions',
    description: 'Description of the checklist purpose',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    type: [ChecklistItemReqDto],
    description: 'Array of checklist items',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemReqDto)
  checklistItems: ChecklistItemReqDto[];

  @ApiProperty({
    example: true,
    description: 'Whether this checklist is active',
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @ApiProperty({
    example: false,
    description: 'Whether this is the default checklist for the company',
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean = false;
}
