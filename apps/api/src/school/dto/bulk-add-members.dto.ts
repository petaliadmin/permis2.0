import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsString, ValidateNested } from 'class-validator';
import { SchoolMemberRole } from '@permis2.0/types';
import { ASSIGNABLE_ROLES } from './add-school-member.dto';

export class BulkMemberRowDto {
  @ApiProperty({ description: 'Full name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Phone number' })
  @IsString()
  phone: string;

  @ApiProperty({ enum: ASSIGNABLE_ROLES })
  @IsIn(ASSIGNABLE_ROLES)
  role: SchoolMemberRole;
}

export class BulkAddMembersDto {
  @ApiProperty({ type: [BulkMemberRowDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => BulkMemberRowDto)
  rows: BulkMemberRowDto[];
}
