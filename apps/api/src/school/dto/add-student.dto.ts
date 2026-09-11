import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, ValidateIf } from 'class-validator';

/**
 * Either userId (existing PERMIS 2.0 account) or guestName+guestPhone (no
 * account yet — manual add, contact import, CSV/Excel import) must be set.
 */
export class AddStudentDto {
  @ApiProperty({ required: false, description: 'Existing user id to attach as a student' })
  @ValidateIf((o) => !o.guestName && !o.guestPhone)
  @IsString()
  userId?: string;

  @ApiProperty({ required: false, description: 'Full name — only when there is no userId' })
  @ValidateIf((o) => !o.userId)
  @IsString()
  guestName?: string;

  @ApiProperty({ required: false, description: 'Phone — only when there is no userId' })
  @ValidateIf((o) => !o.userId)
  @IsString()
  guestPhone?: string;

  @ApiProperty({ required: false, example: 'B' })
  @IsOptional()
  @IsString()
  licenseCategory?: string;
}
