import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { SchoolStatus } from '@permis2.0/types';

export class UpdateSchoolStatusDto {
  @ApiProperty({ enum: SchoolStatus })
  @IsIn(Object.values(SchoolStatus))
  status: SchoolStatus;
}
