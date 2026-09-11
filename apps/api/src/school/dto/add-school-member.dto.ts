import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, ValidateIf } from 'class-validator';
import { SchoolMemberRole } from '@permis2.0/types';

// OWNER is deliberately excluded — ownership transfer is out of Phase 0 scope.
const ASSIGNABLE_ROLES = [
  SchoolMemberRole.MANAGER,
  SchoolMemberRole.SECRETARY,
  SchoolMemberRole.INSTRUCTOR,
  SchoolMemberRole.COACH,
  SchoolMemberRole.ACCOUNTANT,
];

/**
 * Either userId (existing PERMIS 2.0 account) or guestName+guestPhone (no
 * account yet — manual add, contact import, CSV/Excel import) must be set.
 */
export class AddSchoolMemberDto {
  @ApiProperty({ required: false, description: 'Existing user id to attach to the school' })
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

  @ApiProperty({ enum: ASSIGNABLE_ROLES })
  @IsIn(ASSIGNABLE_ROLES)
  role: SchoolMemberRole;
}

export { ASSIGNABLE_ROLES };
