import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AddStudentDto {
  @ApiProperty({ description: 'Existing user id to attach as a student' })
  @IsString()
  userId: string;

  @ApiProperty({ required: false, example: 'B' })
  @IsOptional()
  @IsString()
  licenseCategory?: string;
}
