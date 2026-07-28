import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class CreateEnrollmentRequestDto {
  @ApiProperty({ example: 'Fatou' })
  @IsString()
  @Length(1, 60)
  firstName: string;

  @ApiProperty({ example: 'Diop' })
  @IsString()
  @Length(1, 60)
  lastName: string;

  @ApiProperty({ example: '+221770000000' })
  @IsString()
  phone: string;

  @ApiProperty({ required: false, example: '+221770000000' })
  @IsOptional()
  @IsString()
  whatsapp?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false, example: 'Dakar' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ required: false, example: 'B' })
  @IsOptional()
  @IsString()
  licenseCategory?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  message?: string;
}
