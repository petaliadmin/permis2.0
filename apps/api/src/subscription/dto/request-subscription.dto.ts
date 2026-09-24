import { IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
}
