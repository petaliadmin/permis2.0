import { IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SuspendUserDto {
  @ApiProperty({ example: 7, description: 'Suspension duration in days' })
  @IsInt()
  @Min(1)
  @Max(365)
  days: number;
}
