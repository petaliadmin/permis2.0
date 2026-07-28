import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, Length } from 'class-validator';

export class CreateVehicleDto {
  @ApiProperty({ example: 'DK-1234-AB' })
  @IsString()
  @Length(1, 20)
  plate: string;

  @ApiProperty({ required: false, example: 'Toyota' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiProperty({ required: false, example: 'Yaris' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty({ required: false, example: 'B' })
  @IsOptional()
  @IsString()
  category?: string;

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
