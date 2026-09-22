import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const CATEGORIES = ['Conseils examen', 'Code de la route', 'Permis de conduire', 'Auto-écoles'] as const;

export class ArticleInputDto {
  @ApiProperty({ example: 'erreurs-frequentes-examen-code-route' })
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug doit être en minuscules, chiffres et tirets uniquement',
  })
  slug: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(400)
  description: string;

  @ApiProperty({ enum: CATEGORIES })
  @IsIn(CATEGORIES)
  category: (typeof CATEGORIES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @ApiProperty()
  @IsInt()
  @Min(1)
  readingMinutes: number;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  directAnswer: string;

  @ApiProperty({ type: [Object] })
  @IsArray()
  blocks: Record<string, unknown>[];

  @ApiPropertyOptional({ type: [Object] })
  @IsOptional()
  @IsArray()
  faqs?: Record<string, unknown>[];
}
