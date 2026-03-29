import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend | null = null;

  constructor() {
    const key = process.env.RESEND_API_KEY;
    if (key && key !== 'YOUR_RESEND_API_KEY') {
      this.resend = new Resend(key);
    } else {
      this.logger.warn('RESEND_API_KEY not set — emails will be logged only');
    }
  }

  private get from() {
    return process.env.MAIL_FROM || 'TechChampsByRev <onboarding@resend.dev>';
  }

  private async send(to: string, subject: string, html: string) {
    if (!this.resend) {
      this.logger.log(`[MAIL SKIPPED] To: ${to} | Subject: ${subject}`);
      return;
    }
    try {
      await this.resend.emails.send({ from: this.from, to, subject, html });
      this.logger.log(`Mail sent → ${to} | ${subject}`);
    } catch (err) {
      this.logger.error(`Mail failed → ${to} | ${subject}`, err);
    }
  }

  // ── Slot booking confirmation to user ──────────────────────────────────────
  async sendBookingConfirmation(opts: {
    name: string;
    email: string;
    date: string;
    start_time: string;
    end_time: string;
  }) {
    const { name, email, date, start_time, end_time } = opts;
    const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    });
    const time = `${fmt12(start_time)} – ${fmt12(end_time)}`;

    await this.send(email, '✅ Your 1:1 Career Call is Confirmed!', `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:12px;">
        <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
          <h1 style="color:#0f172a;font-size:22px;margin:0 0 8px;">Hi ${name} 👋</h1>
          <p style="color:#64748b;font-size:15px;margin:0 0 24px;">Your 1:1 career call has been successfully booked!</p>

          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:20px;margin-bottom:24px;">
            <p style="margin:0 0 10px;color:#1e40af;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;">Booking Details</p>
            <table style="width:100%;font-size:14px;border-collapse:collapse;">
              <tr><td style="color:#64748b;padding:4px 0;">Date</td><td style="color:#0f172a;font-weight:600;">${formattedDate}</td></tr>
              <tr><td style="color:#64748b;padding:4px 0;">Time</td><td style="color:#0f172a;font-weight:600;">${time} IST</td></tr>
              <tr><td style="color:#64748b;padding:4px 0;">Duration</td><td style="color:#0f172a;font-weight:600;">1 Hour</td></tr>
            </table>
          </div>

          <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px;">
            We'll reach out to you with the meeting link before the session. Make sure to keep your resume and any questions ready!
          </p>

          <p style="color:#94a3b8;font-size:13px;margin:0;">
            Questions? Reply to this email or reach us on WhatsApp.<br/>
            — <strong>TechChampsByRev Team</strong>
          </p>
        </div>
      </div>
    `);
  }

  // ── Notify admin when a slot is booked ──────────────────────────────────────
  async sendAdminBookingAlert(opts: {
    name: string;
    email: string;
    date: string;
    start_time: string;
    end_time: string;
  }) {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) return;

    const { name, email, date, start_time, end_time } = opts;
    const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    });
    const time = `${fmt12(start_time)} – ${fmt12(end_time)}`;

    await this.send(adminEmail, `📅 New Booking: ${name}`, `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:12px;">
        <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
          <h2 style="color:#0f172a;font-size:18px;margin:0 0 16px;">New 1:1 Call Booked</h2>
          <table style="width:100%;font-size:14px;border-collapse:collapse;">
            <tr><td style="color:#64748b;padding:6px 0;width:80px;">Name</td><td style="color:#0f172a;font-weight:600;">${name}</td></tr>
            <tr><td style="color:#64748b;padding:6px 0;">Email</td><td style="color:#0f172a;">${email}</td></tr>
            <tr><td style="color:#64748b;padding:6px 0;">Date</td><td style="color:#0f172a;font-weight:600;">${formattedDate}</td></tr>
            <tr><td style="color:#64748b;padding:6px 0;">Time</td><td style="color:#0f172a;font-weight:600;">${time} IST</td></tr>
          </table>
        </div>
      </div>
    `);
  }

  // ── Slot cancellation to user ───────────────────────────────────────────────
  async sendCancellationNotice(opts: {
    name: string;
    email: string;
    date: string;
    start_time: string;
    end_time: string;
  }) {
    const { name, email, date, start_time, end_time } = opts;
    const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    });
    const time = `${fmt12(start_time)} – ${fmt12(end_time)}`;

    await this.send(email, '❌ Your 1:1 Call Has Been Cancelled', `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:12px;">
        <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
          <h1 style="color:#0f172a;font-size:22px;margin:0 0 8px;">Hi ${name},</h1>
          <p style="color:#64748b;font-size:15px;margin:0 0 24px;">Unfortunately your 1:1 career call has been cancelled.</p>

          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:20px;margin-bottom:24px;">
            <table style="width:100%;font-size:14px;border-collapse:collapse;">
              <tr><td style="color:#64748b;padding:4px 0;">Date</td><td style="color:#0f172a;font-weight:600;">${formattedDate}</td></tr>
              <tr><td style="color:#64748b;padding:4px 0;">Time</td><td style="color:#0f172a;font-weight:600;">${time} IST</td></tr>
            </table>
          </div>

          <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px;">
            If this was unexpected, please contact us and we'll reschedule at the earliest.
          </p>
          <p style="color:#94a3b8;font-size:13px;margin:0;">— <strong>TechChampsByRev Team</strong></p>
        </div>
      </div>
    `);
  }

  // ── Order confirmation ──────────────────────────────────────────────────────
  async sendOrderConfirmation(opts: {
    name: string;
    email: string;
    service: string;
    order_id: string;
    amount: string;
  }) {
    const { name, email, service, order_id, amount } = opts;

    await this.send(email, '🎉 Order Confirmed — TechChampsByRev', `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:12px;">
        <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
          <h1 style="color:#0f172a;font-size:22px;margin:0 0 8px;">Order Confirmed! 🎉</h1>
          <p style="color:#64748b;font-size:15px;margin:0 0 24px;">Hi ${name}, your order has been received and we're on it!</p>

          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px;margin-bottom:24px;">
            <table style="width:100%;font-size:14px;border-collapse:collapse;">
              <tr><td style="color:#64748b;padding:4px 0;">Service</td><td style="color:#0f172a;font-weight:600;">${service}</td></tr>
              <tr><td style="color:#64748b;padding:4px 0;">Order ID</td><td style="color:#0f172a;font-family:monospace;">${order_id}</td></tr>
              <tr><td style="color:#64748b;padding:4px 0;">Amount</td><td style="color:#059669;font-weight:700;">${amount}</td></tr>
            </table>
          </div>

          <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px;">
            We'll contact you shortly with a questionnaire to get started. Typical delivery is within your plan's timeframe.
          </p>
          <p style="color:#94a3b8;font-size:13px;margin:0;">— <strong>TechChampsByRev Team</strong></p>
        </div>
      </div>
    `);
  }
}

function fmt12(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 || 12;
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
}
