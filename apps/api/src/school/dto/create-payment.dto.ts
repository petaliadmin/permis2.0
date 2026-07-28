import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ description: 'SchoolStudent id' })
  @IsString()
  studentId: string;

  @ApiProperty({ example: 150000 })
  @IsInt()
  @Min(0)
  amountXof: number;

  @ApiProperty({ example: "Frais d'inscription" })
  @IsString()
  @Length(1, 200)
  description: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ required: false, example: 'Espèces' })
  @IsOptional()
  @IsString()
  method?: string;
}
