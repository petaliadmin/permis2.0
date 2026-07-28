import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';
import { SchoolPaymentStatus } from '@permis2.0/types';

export class UpdatePaymentDto {
  @ApiProperty({ required: false, enum: SchoolPaymentStatus })
  @IsOptional()
  @IsIn(Object.values(SchoolPaymentStatus))
  status?: SchoolPaymentStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  method?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
