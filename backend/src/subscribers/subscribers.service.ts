import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class SubscribersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  private cachedLimit: number | null = null;

  private async getDefaultLimit(): Promise<number> {
    if (this.cachedLimit) return this.cachedLimit;
    const s = await this.prisma.setting.findUnique({ where: { key: 'pagination_default_limit' } });
    this.cachedLimit = s ? parseInt(s.value, 10) || 20 : 20;
    return this.cachedLimit;
  }

  async findAll(page = 1, limit?: number) {
    const take = Math.min(limit ?? await this.getDefaultLimit(), 200);
    const skip = (page - 1) * take;
    return this.prisma.subscriber.findMany({ orderBy: { created_at: 'desc' }, skip, take });
  }

  async create(data: { email?: string; whatsapp?: string; type?: string }) {
    if (data.email) {
      const existing = await this.prisma.subscriber.findFirst({ where: { email: data.email } });
      // Deliberate departure from the anti-enumeration default (compare
      // start-auth/check-email): product requirement is to tell the visitor
      // outright that the email is already on the list, rather than silently
      // no-op. Also skips re-sending the welcome email here — an existing
      // subscriber re-submitting the form shouldn't get spammed with another
      // "you're on the list!".
      if (existing) throw new ConflictException('A subscriber with this email already exists.');
    }
    const subscriber = await this.prisma.subscriber.create({ data });

    // Fire-and-forget — matches the pattern used for the user-signup welcome
    // email, keeps p95 latency on this endpoint low. MailService swallows its
    // own errors, so a mail failure never surfaces as a failed subscription.
    if (subscriber.email) {
      const siteUrl = process.env.PUBLIC_SITE_URL || 'https://www.techchampsbyrev.in';
      this.mail.sendSubscriberWelcome({
        email: subscriber.email,
        unsubscribeUrl: `${siteUrl}/unsubscribe/${subscriber.id}`,
      }).catch(() => undefined);
    }

    return subscriber;
  }

  async update(id: string, data: { active?: boolean }) {
    return this.prisma.subscriber.update({ where: { id }, data });
  }

  /**
   * Public, self-serve unsubscribe — the subscriber's own (unguessable) UUID
   * doubles as its own access token, same pattern as the optimizer's share
   * links. Idempotent and silent on a bad/already-removed id so the endpoint
   * can't be used to probe which ids exist.
   */
  async unsubscribe(id: string): Promise<{ message: string }> {
    try {
      await this.prisma.subscriber.update({ where: { id }, data: { active: false } });
    } catch {
      // Unknown id — no-op, same response either way.
    }
    return { message: 'You have been unsubscribed.' };
  }

  async remove(id: string) {
    return this.prisma.subscriber.delete({ where: { id } });
  }

  count() {
    return this.prisma.subscriber.count();
  }
}
