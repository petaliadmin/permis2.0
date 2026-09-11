import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsOptional, IsString, Length, ValidateNested } from 'class-validator';

export class BulkVehicleRowDto {
  @ApiProperty({ example: 'DK-1234-AB' })
  @IsString()
  @Length(1, 20)
  plate: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty({ required: false, example: 'B' })
  @IsOptional()
  @IsString()
  category?: string;
}

export class BulkCreateVehiclesDto {
  @ApiProperty({ type: [BulkVehicleRowDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => BulkVehicleRowDto)
  rows: BulkVehicleRowDto[];
}
