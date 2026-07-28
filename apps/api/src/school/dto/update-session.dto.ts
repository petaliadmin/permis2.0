import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';
import { SessionStatus, SessionType } from '@permis2.0/types';

export class UpdateSessionDto {
  @ApiProperty({ required: false, enum: SessionType })
  @IsOptional()
  @IsIn(Object.values(SessionType))
  type?: SessionType;

  @ApiProperty({ required: false, enum: SessionStatus })
  @IsOptional()
  @IsIn(Object.values(SessionStatus))
  status?: SessionStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  instructorMembershipId?: string | null;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  @IsString()
  vehicleId?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
