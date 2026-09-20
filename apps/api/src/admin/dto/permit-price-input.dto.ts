import { IsInt, IsOptional, IsString, Min, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PermitPriceInputDto {
  @ApiProperty({ example: 'Dakar' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city: string;

  @ApiProperty({ example: 'B' })
  @IsString()
  @MinLength(1)
  @MaxLength(10)
  category: string;

  @ApiProperty({ example: 150000 })
  @IsInt()
  @Min(0)
  priceXof: number;

  @ApiPropertyOptional({ example: 'Code + conduite' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}
