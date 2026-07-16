import { IsString, IsIn, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { PaymentMethod } from '@permis2.0/types';

export class CheckoutDto {
  @ApiProperty({ example: 'clz...', description: 'Product id to purchase' })
  @IsString()
  productId: string;

  @ApiProperty({
    example: '+221770000000',
    description: 'Mobile Money phone number (optional pre-fill)',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    example: 'orange_money',
    enum: ['orange_money', 'wave', 'free_money', 'card'],
    required: false,
    description: 'Tracking hint only — all methods are handled by the Bictorys hosted checkout',
  })
  @IsOptional()
  @IsIn(['orange_money', 'wave', 'free_money', 'card'])
  method?: PaymentMethod;
}
