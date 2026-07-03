import { IsArray, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitAnswerDto {
  @ApiProperty({ example: 'choice-id-123' })
  @IsString()
  answer: string;

  // Optional multi-answer field for questions with several correct choices.
  // When present, it takes precedence over `answer`.
  @ApiPropertyOptional({ example: ['choice-id-123', 'choice-id-456'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  answers?: string[];
}
