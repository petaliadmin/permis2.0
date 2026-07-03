import { IsString, IsIn, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { PaymentMethod } from '@permis2.0/types';

export class CheckoutDto {
  @ApiProperty({ example: 'clz...', description: 'Product id to purchase' })
  @IsString()
  productId: string;

  @ApiProperty({ example: '+221770000000', description: 'Mobile Money phone number' })
  @IsString()
  phone: string;

  @ApiProperty({
    example: 'orange_money',
    enum: ['orange_money', 'wave', 'card'],
    required: false,
    description: 'Payment method chosen by the user (mapped to a Bictorys payment_type)',
  })
  @IsOptional()
  @IsIn(['orange_money', 'wave', 'card'])
  method?: PaymentMethod;
}
