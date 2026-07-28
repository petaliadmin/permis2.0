import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';
import { SessionType } from '@permis2.0/types';

export class CreateSessionDto {
  @ApiProperty({ description: 'SchoolStudent id' })
  @IsString()
  studentId: string;

  @ApiProperty({ enum: SessionType, default: SessionType.PRACTICE })
  @IsIn(Object.values(SessionType))
  type: SessionType;

  @ApiProperty()
  @IsDateString()
  startsAt: string;

  @ApiProperty()
  @IsDateString()
  endsAt: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  instructorMembershipId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  vehicleId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
