import { Injectable, Logger } from '@nestjs/common';
import * as webpush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly configured: boolean;

  constructor(private prisma: PrismaService) {
    const pub = process.env.VAPID_PUBLIC_KEY;
    const priv = process.env.VAPID_PRIVATE_KEY;
    const mail = process.env.VAPID_EMAIL || 'mailto:admin@permis2.com';

    if (pub && priv) {
      webpush.setVapidDetails(mail, pub, priv);
      this.configured = true;
    } else {
      this.logger.warn('VAPID keys not set — web push disabled');
      this.configured = false;
    }
  }

  get vapidPublicKey() {
    return process.env.VAPID_PUBLIC_KEY ?? '';
  }

  async subscribe(userId: string, endpoint: string, p256dh: string, auth: string) {
    return this.prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { p256dh, auth, userId },
      create: { userId, endpoint, p256dh, auth },
    });
  }

  async unsubscribe(userId: string, endpoint: string) {
    return this.prisma.pushSubscription.deleteMany({ where: { endpoint, userId } });
  }

  /** Send a push notification to every subscribed device of a user. */
  async sendToUser(userId: string, title: string, body: string, url = '/notifications') {
    if (!this.configured) return;

    const subs = await this.prisma.pushSubscription.findMany({ where: { userId } });
    const payload = JSON.stringify({ title, body, url });

    await Promise.allSettled(
      subs.map((s) =>
        webpush
          .sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload
          )
          .catch((err) => {
            // 410 Gone = subscription expired — clean up
            if (err.statusCode === 410) {
              return this.prisma.pushSubscription.delete({ where: { id: s.id } });
            }
          })
      )
    );
  }
}
