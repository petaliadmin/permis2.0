import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';

/**
 * One row from a CSV/Excel import, a contact-picker multi-select, or a
 * manual bulk add. Resolution (existing account vs guest) happens server-side
 * in SchoolService.addStudentsBulk by looking up guestPhone.
 */
export class BulkStudentRowDto {
  @ApiProperty({ description: 'Full name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Phone number' })
  @IsString()
  phone: string;

  @ApiProperty({ required: false, example: 'B' })
  @IsOptional()
  @IsString()
  licenseCategory?: string;
}

export class BulkAddStudentsDto {
  @ApiProperty({ type: [BulkStudentRowDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => BulkStudentRowDto)
  rows: BulkStudentRowDto[];
}
