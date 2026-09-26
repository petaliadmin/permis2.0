import { Body, Controller, Post, ServiceUnavailableException } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { EmailService } from '../email/email.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';

@ApiTags('contact')
@Controller('contact')
export class ContactController {
  constructor(private emailService: EmailService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiResponse({ status: 201, description: 'Contact message forwarded to the team inbox' })
  async submit(@Body() dto: CreateContactMessageDto) {
    try {
      await this.emailService.sendContactMessage(dto);
    } catch {
      throw new ServiceUnavailableException(
        "L'envoi du message a échoué, réessayez ou contactez-nous directement."
      );
    }
    return { ok: true };
  }
}
