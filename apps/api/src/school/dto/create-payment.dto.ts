import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';
import { SchoolPaymentType } from '@permis2.0/types';

export class PaymentItemDto {
  @ApiProperty({ example: "Frais d'inscription" })
  @IsString()
  @Length(1, 200)
  label: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  qty: number;

  @ApiProperty({ example: 150000 })
  @IsInt()
  @Min(0)
  unitPriceXof: number;
}

export class CreatePaymentDto {
  @ApiProperty({ description: 'SchoolStudent id' })
  @IsString()
  studentId: string;

  @ApiProperty({ enum: SchoolPaymentType, default: SchoolPaymentType.FACTURE })
  @IsOptional()
  @IsIn(Object.values(SchoolPaymentType))
  type?: SchoolPaymentType;

  @ApiProperty({
    type: [PaymentItemDto],
    description: 'Line items — amountXof is computed server-side as their sum',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => PaymentItemDto)
  items: PaymentItemDto[];

  @ApiProperty({ example: "Frais d'inscription", description: 'Short summary shown in lists' })
  @IsString()
  @Length(1, 200)
  description: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ required: false, example: 'Espèces' })
  @IsOptional()
  @IsString()
  method?: string;
}
