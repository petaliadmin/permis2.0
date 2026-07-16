import { IsString, IsIn, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestOtpDto {
  @ApiProperty({
    example: '771234567',
    description: 'Numéro sénégalais sans indicatif (9 chiffres)',
  })
  @IsString()
  @Matches(/^(77|78|76|70|75|33)\d{7}$/, {
    message: 'Numéro sénégalais invalide (77, 78, 76, 70, 75 ou 33 suivi de 7 chiffres)',
  })
  phone: string;

  @ApiProperty({ enum: ['sms', 'whatsapp'], default: 'whatsapp' })
  @IsIn(['sms', 'whatsapp'])
  channel: 'sms' | 'whatsapp';
}
