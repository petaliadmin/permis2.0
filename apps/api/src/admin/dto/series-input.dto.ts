import { IsBoolean, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SeriesInputDto {
  @ApiProperty({ example: 'Série 4' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'Quatrième série de 25 questions' })
  @IsString()
  @MaxLength(500)
  description: string;

  @ApiProperty({ example: 'B4', description: 'Code unique (lettres/chiffres)' })
  @IsString()
  @Matches(/^[A-Z0-9_-]{1,10}$/i, { message: 'Code invalide (lettres, chiffres, 10 max)' })
  code: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  isFree: boolean;
}
