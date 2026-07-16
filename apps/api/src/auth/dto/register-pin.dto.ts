import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterPinDto {
  @ApiProperty({ example: 'Moussa Diop' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: '771234567' })
  @IsString()
  @Matches(/^(77|78|76|70|75|33)\d{7}$/, {
    message: 'Numéro sénégalais invalide (77, 78, 76, 70, 75 ou 33 suivi de 7 chiffres)',
  })
  phone: string;

  @ApiProperty({ example: '1234', description: 'Code de sécurité à 4 chiffres' })
  @IsString()
  @Matches(/^\d{4}$/, { message: 'Le code PIN doit contenir exactement 4 chiffres' })
  pin: string;
}
