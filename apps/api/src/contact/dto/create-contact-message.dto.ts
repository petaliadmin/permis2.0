import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class CreateContactMessageDto {
  @ApiProperty({ example: 'Fatou Diop' })
  @IsString()
  @Length(1, 100)
  name: string;

  @ApiProperty({ example: 'fatou@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ required: false, example: 'Question sur mon abonnement' })
  @IsOptional()
  @IsString()
  @Length(0, 150)
  subject?: string;

  @ApiProperty({ example: 'Bonjour, je voudrais savoir...' })
  @IsString()
  @Length(1, 2000)
  message: string;
}
