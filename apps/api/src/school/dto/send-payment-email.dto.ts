import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class SendPaymentEmailDto {
  @ApiProperty({ example: 'client@example.com' })
  @IsEmail()
  to: string;

  @ApiProperty({ description: 'PDF file, base64-encoded (no data: prefix)' })
  @IsString()
  pdfBase64: string;

  @ApiProperty({ example: 'facture-F-2026-0001.pdf' })
  @IsString()
  filename: string;
}
