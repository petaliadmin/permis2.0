import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

// Deliberately does not extend CreateSchoolDto's `name` requirement — every
// field here is optional, `slug` and `status` are never client-settable.
export class UpdateSchoolDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(2, 120)
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  whatsapp?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty({ required: false, description: 'Free-form map, e.g. { "lun-ven": "8h-18h" }' })
  @IsOptional()
  @IsObject()
  openingHours?: Record<string, string>;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  licenseCategories?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  priceXof?: number;

  @ApiProperty({
    required: false,
    description: 'Price in FCFA per license category code, e.g. { "A": 80000, "B": 150000 }',
    example: { B: 150000 },
  })
  @IsOptional()
  @IsObject()
  pricesByCategory?: Record<string, number>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsLongitude()
  longitude?: number;
}
