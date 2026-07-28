import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class CreateSchoolDto {
  @ApiProperty({ example: "Auto-École Réussite" })
  @IsString()
  @Length(2, 120)
  name: string;

  @ApiProperty({ required: false, example: 'Dakar' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ required: false, example: 'Sacré-Cœur 3' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ required: false, example: '+221770000000' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false, example: '+221770000000' })
  @IsOptional()
  @IsString()
  whatsapp?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false, type: [String], example: ['code', 'conduite'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services?: string[];

  @ApiProperty({ required: false, type: [String], example: ['B'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  licenseCategories?: string[];
}
