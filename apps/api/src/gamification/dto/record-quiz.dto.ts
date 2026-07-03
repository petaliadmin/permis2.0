import { IsInt, Min, Max } from 'class-validator';

export class RecordQuizDto {
  @IsInt()
  @Min(0)
  @Max(200)
  correct: number;

  @IsInt()
  @Min(0)
  @Max(200)
  total: number;
}
