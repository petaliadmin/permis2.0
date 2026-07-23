import { IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ClaimSeatDto {
  @ApiProperty({ example: 'AB3D9F2K', description: 'School-pack seat code to redeem' })
  @IsString()
  @Length(4, 16)
  code: string;
}
