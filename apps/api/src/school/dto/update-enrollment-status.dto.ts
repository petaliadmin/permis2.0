import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { SchoolEnrollmentStatus } from '@permis2.0/types';

export class UpdateEnrollmentStatusDto {
  @ApiProperty({ enum: SchoolEnrollmentStatus })
  @IsIn(Object.values(SchoolEnrollmentStatus))
  status: SchoolEnrollmentStatus;

  @ApiProperty({ required: false, description: 'Motif de refus / note interne staff' })
  @IsOptional()
  @IsString()
  statusNote?: string;
}
