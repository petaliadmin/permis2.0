import { IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRoleDto {
  @ApiProperty({ enum: ['USER', 'ADMIN'], example: 'ADMIN' })
  @IsIn(['USER', 'ADMIN'])
  role: 'USER' | 'ADMIN';
}
