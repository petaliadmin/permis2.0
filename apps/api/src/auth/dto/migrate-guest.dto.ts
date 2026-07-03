import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GuestAnswerDto {
  @IsString()
  questionId: string;

  @IsBoolean()
  isCorrect: boolean;
}

export class MigrateGuestDto {
  @ApiPropertyOptional({ example: 120, description: 'XP accumulated as a guest' })
  @IsOptional()
  @IsInt()
  @Min(0)
  xp?: number;

  @ApiPropertyOptional({ example: 5, description: 'Best correct-answer streak as a guest' })
  @IsOptional()
  @IsInt()
  @Min(0)
  bestStreak?: number;

  @ApiPropertyOptional({ type: [GuestAnswerDto], description: 'Per-question answers recorded as a guest' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuestAnswerDto)
  answers?: GuestAnswerDto[];
}
