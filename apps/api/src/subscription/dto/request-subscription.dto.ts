import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

/** The only payment methods a client may self-declare — both are manual
 * (transfer-then-confirm), never a real gateway charge. ORANGE_MONEY/CARD/
 * ADMIN are never accepted from the client, only set server-side. */
export const CLIENT_PAYMENT_METHODS = ['WHATSAPP', 'WAVE'] as const;
export type ClientPaymentMethod = (typeof CLIENT_PAYMENT_METHODS)[number];

export class RequestSubscriptionDto {
  @ApiProperty({ example: 'plan-id-123' })
  @IsString()
  planId: string;

  // Required for SCHOOL / SCHOOL_FEATURED plans — validated server-side against
  // the plan's type (see SubscriptionService.requestSubscription).
  @ApiPropertyOptional({ example: 'school-id-123' })
  @IsOptional()
  @IsString()
  schoolId?: string;

  @ApiPropertyOptional({ enum: CLIENT_PAYMENT_METHODS, default: 'WHATSAPP' })
  @IsOptional()
  @IsIn(CLIENT_PAYMENT_METHODS)
  method?: ClientPaymentMethod;
}
