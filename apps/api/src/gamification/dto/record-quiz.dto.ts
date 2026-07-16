import { IsInt, IsIn, IsOptional, Min, Max } from 'class-validator';

export class RecordQuizDto {
  @IsInt()
  @Min(0)
  @Max(200)
  correct: number;

  @IsInt()
  @Min(0)
  @Max(200)
  total: number;

  /** Origin of the quiz — informational only (series | exam | signs). */
  @IsOptional()
  @IsIn(['series', 'exam', 'signs'])
  mode?: string;
}
