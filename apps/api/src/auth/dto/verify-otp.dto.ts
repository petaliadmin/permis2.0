import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({ example: '771234567' })
  @IsString()
  @Matches(/^(77|78|76|70|75|33)\d{7}$/, {
    message: 'Numéro sénégalais invalide (77, 78, 76, 70, 75 ou 33 suivi de 7 chiffres)',
  })
  phone: string;

  @ApiProperty({ example: '123456', description: 'Code OTP à 6 chiffres' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Le code OTP doit contenir exactement 6 chiffres' })
  otp: string;
}
