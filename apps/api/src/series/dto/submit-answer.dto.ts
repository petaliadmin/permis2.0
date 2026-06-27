import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitAnswerDto {
  @ApiProperty({ example: 'choice-id-123' })
  @IsString()
  answer: string;
}
