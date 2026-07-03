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
  phone: string;

  @ApiProperty({ example: '1234', description: 'Code de sécurité à 4 chiffres' })
  @IsString()
  @Matches(/^\d{4}$/, { message: 'Le code PIN doit contenir exactement 4 chiffres' })
  pin: string;
}
