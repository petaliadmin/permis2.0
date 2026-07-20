import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QuestionInputDto {
  @ApiProperty()
  @IsString()
  serieId: string;

  @ApiProperty()
  @IsString()
  categoryId: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  numero: number;

  @ApiProperty({ example: 'Que signifie ce panneau ?' })
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  enonce: string;

  @ApiProperty({ type: [String], example: ['Stop', 'Cédez le passage', 'Sens interdit'] })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(6)
  @IsString({ each: true })
  choices: string[];

  @ApiProperty({ type: [String], example: ['Stop'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  reponses_correctes: string[];

  @ApiProperty({ example: 'Le panneau octogonal rouge impose un arrêt complet.' })
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  explication: string;

  // Quiz questions: '/icons/panneaux/{code}.svg' (see apps/web/public/icons/panneaux)
  // Diapo exam questions: '/data/diapos/{serie}_q{n}.webp' (see apps/web/public/data/diapos)
  @ApiPropertyOptional({ example: '/icons/panneaux/A3a.svg' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  signalisation_visible?: string;
}
