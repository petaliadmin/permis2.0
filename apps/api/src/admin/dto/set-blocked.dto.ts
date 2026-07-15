import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetBlockedDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  blocked: boolean;
}
