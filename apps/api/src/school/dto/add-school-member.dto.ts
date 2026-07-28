import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';
import { SchoolMemberRole } from '@permis2.0/types';

// OWNER is deliberately excluded — ownership transfer is out of Phase 0 scope.
const ASSIGNABLE_ROLES = [
  SchoolMemberRole.MANAGER,
  SchoolMemberRole.SECRETARY,
  SchoolMemberRole.INSTRUCTOR,
  SchoolMemberRole.COACH,
  SchoolMemberRole.ACCOUNTANT,
];

export class AddSchoolMemberDto {
  @ApiProperty({ description: 'Existing user id to attach to the school' })
  @IsString()
  userId: string;

  @ApiProperty({ enum: ASSIGNABLE_ROLES })
  @IsIn(ASSIGNABLE_ROLES)
  role: SchoolMemberRole;
}
