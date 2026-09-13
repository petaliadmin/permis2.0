import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestManualDto {
  @ApiProperty({ example: 'clz...', description: 'Product id being requested' })
  @IsString()
  productId: string;

  @ApiProperty({
    required: false,
    example: 'clz...',
    description: 'Required for school-scoped products (school_subscription, featured_placement) — the school the buyer owns',
  })
  @IsOptional()
  @IsString()
  schoolId?: string;
}
