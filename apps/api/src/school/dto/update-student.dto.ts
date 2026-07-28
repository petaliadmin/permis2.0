import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { SchoolStudentStatus } from '@permis2.0/types';

export class UpdateStudentDto {
  @ApiProperty({ required: false, enum: SchoolStudentStatus })
  @IsOptional()
  @IsIn(Object.values(SchoolStudentStatus))
  status?: SchoolStudentStatus;

  @ApiProperty({ required: false, example: 'B' })
  @IsOptional()
  @IsString()
  licenseCategory?: string;

  @ApiProperty({ required: false, nullable: true, description: 'null to unassign' })
  @IsOptional()
  @IsString()
  assignedInstructorMembershipId?: string | null;

  @ApiProperty({ required: false, nullable: true, description: 'null to unassign' })
  @IsOptional()
  @IsString()
  assignedVehicleId?: string | null;
}
