import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class StartExamDto {
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(50)
  numberOfQuestions?: number;

  @IsOptional()
  @IsString()
  templateId?: string;
}
