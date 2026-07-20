import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestManualDto {
  @ApiProperty({ example: 'clz...', description: 'Product id being requested' })
  @IsString()
  productId: string;
}
