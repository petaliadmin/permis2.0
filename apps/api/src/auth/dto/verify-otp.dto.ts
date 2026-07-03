import { IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({ example: '771234567' })
  @IsString()
  phone: string;

  @ApiProperty({ example: '123456', description: 'Code OTP à 6 chiffres' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Le code OTP doit contenir exactement 6 chiffres' })
  otp: string;
}
