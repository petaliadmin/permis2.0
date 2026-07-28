import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString, Length } from 'class-validator';
import { VehicleStatus } from '@permis2.0/types';

export class UpdateVehicleDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  plate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ required: false, enum: VehicleStatus })
  @IsOptional()
  @IsIn(Object.values(VehicleStatus))
  status?: VehicleStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  insuranceExpiresAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  technicalInspectionExpiresAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
