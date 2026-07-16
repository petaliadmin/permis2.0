import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPinDto {
  @ApiProperty({ example: '771234567' })
  @IsString()
  @Matches(/^(77|78|76|70|75|33)\d{7}$/, {
    message: 'Numéro sénégalais invalide (77, 78, 76, 70, 75 ou 33 suivi de 7 chiffres)',
  })
  phone: string;

  @ApiProperty({ example: '123456', description: 'Code OTP à 6 chiffres reçu par SMS' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Le code OTP doit contenir exactement 6 chiffres' })
  otp: string;

  @ApiProperty({ example: '1234', description: 'Nouveau code de sécurité à 4 chiffres' })
  @IsString()
  @Matches(/^\d{4}$/, { message: 'Le code PIN doit contenir exactement 4 chiffres' })
  pin: string;
}
