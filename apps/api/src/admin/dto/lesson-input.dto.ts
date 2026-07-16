import { IsArray, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LessonInputDto {
  @ApiProperty()
  @IsString()
  categoryId: string;

  @ApiProperty({ example: 'La priorité à droite' })
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  titre: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  contenu: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  points_cles?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  exceptions?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  erreurs_frequentes?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  regles?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Chemins d’images associées (ex. /icons/panneaux/AB4.svg)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  illustrations?: string[];
}
