import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend | null = null;

  constructor(private readonly prisma: PrismaService) {
    const key = process.env.RESEND_API_KEY;
    if (key && key !== 'YOUR_RESEND_API_KEY') {
      this.resend = new Resend(key);
    } else {
      this.logger.warn('RESEND_API_KEY not set — emails will be logged only');
    }
  }

  private async getSetting(key: string, fallback: string): Promise<string> {
    try {
      const s = await this.prisma.setting.findUnique({ where: { key } });
      return s?.value || fallback;
    } catch {
      return fallback;
    }
  }

  private get from() {
    return process.env.MAIL_FROM || 'TechChampsByRev <onboarding@resend.dev>';
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    return `${local[0]}***@${domain}`;
  }

  private async send(to: string, subject: string, html: string) {
    const masked = this.maskEmail(to);
    if (!this.resend) {
      this.logger.log(`[MAIL SKIPPED] To: ${masked} | Subject: ${subject}`);
      return;
    }
    try {
      await this.resend.emails.send({ from: this.from, to, subject, html });
      this.logger.log(`Mail sent → ${masked} | ${subject}`);
    } catch (err) {
      this.logger.error(`Mail failed → ${masked} | ${subject}`, err);
    }
  }

  // ── Weekly digest (fires Monday 9 AM IST) ──────────────────────────────────
  async sendWeeklyDigest(opts: {
    email: string;
    name: string | null;
    weekly_xp: number;
    current_streak: number;
    level: number;
    target_role: string | null;
    new_jobs: { id: string; title: string; company: string; location: string; salary: string | null }[];
  }) {
    const { email, name, weekly_xp, current_streak, level, target_role, new_jobs } = opts;
    const greeting = name ? `Hi ${name},` : 'Hi there,';
    const subject = `Your week on TechChampsByRev (+${weekly_xp} XP)`;
    const teamName = await this.getSetting('email_team_name', 'TechChampsByRev Team');
    const siteUrl = process.env.PUBLIC_SITE_URL || 'https://techchampsbyrev.com';

    const jobsHtml = new_jobs.length === 0
      ? `<p style="color:#94a3b8;font-size:13px;margin:0;">No new matching jobs this week — check back Monday.</p>`
      : new_jobs.map(j => `
          <a href="${siteUrl}/jobs/${j.id}" style="display:block;padding:12px 14px;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:8px;text-decoration:none;background:#fff;">
            <div style="font-size:14px;font-weight:700;color:#0f172a;">${j.title}</div>
            <div style="font-size:12px;color:#64748b;margin-top:2px;">${j.company} · ${j.location}${j.salary ? ` · ${j.salary}` : ''}</div>
          </a>
        `).join('');

    await this.send(email, subject, `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:12px;">
        <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
          <h1 style="color:#0f172a;font-size:22px;margin:0 0 8px;">${greeting}</h1>
          <p style="color:#64748b;font-size:14px;margin:0 0 22px;">Here's your week on TechChampsByRev.</p>

          <div style="display:flex;gap:10px;margin-bottom:24px;">
            <div style="flex:1;padding:14px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;text-align:center;">
              <div style="font-size:22px;font-weight:800;color:#1d4ed8;">+${weekly_xp}</div>
              <div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">XP this week</div>
            </div>
            <div style="flex:1;padding:14px;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;text-align:center;">
              <div style="font-size:22px;font-weight:800;color:#b45309;">🔥 ${current_streak}</div>
              <div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Day streak</div>
            </div>
            <div style="flex:1;padding:14px;background:#f5f3ff;border:1px solid #ddd6fe;border-radius:10px;text-align:center;">
              <div style="font-size:22px;font-weight:800;color:#7c3aed;">Lv ${level}</div>
              <div style="font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;font-weight:600;">Current level</div>
            </div>
          </div>

          <h2 style="color:#0f172a;font-size:15px;margin:0 0 12px;">
            New jobs for ${target_role ? `<strong>${target_role}</strong>` : 'you'}
          </h2>
          ${jobsHtml}

          <div style="text-align:center;margin:28px 0 8px;">
            <a href="${siteUrl}/dashboard" style="display:inline-block;padding:12px 28px;background:#2563eb;color:#fff;text-decoration:none;font-weight:700;border-radius:9px;font-size:14px;">
              Open my dashboard →
            </a>
          </div>

          <p style="color:#94a3b8;font-size:11px;margin:28px 0 0;text-align:center;">
            You're getting this because you opted in. Update preferences at <a href="${siteUrl}/account" style="color:#94a3b8;">your account</a>.
          </p>
          <p style="color:#cbd5e1;font-size:11px;margin:14px 0 0;text-align:center;">— ${teamName}</p>
        </div>
      </div>
    `);
  }

  // ── Streak reminder (fired at 8 PM IST for users whose streak is at risk) ─
  async sendStreakReminder(opts: { email: string; name?: string | null; current_streak: number }) {
    const { email, name, current_streak } = opts;
    const greeting = name ? `Hey ${name},` : 'Hey there,';
    const subject = `🔥 Don't lose your ${current_streak}-day streak`;
    const teamName = await this.getSetting('email_team_name', 'TechChampsByRev Team');
    const challengeUrl = (process.env.PUBLIC_SITE_URL || 'https://techchampsbyrev.com') + '/challenges';

    await this.send(email, subject, `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:12px;">
        <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
          <div style="text-align:center;margin-bottom:18px;">
            <div style="display:inline-block;font-size:56px;line-height:1;">🔥</div>
          </div>
          <h1 style="color:#0f172a;font-size:22px;margin:0 0 8px;text-align:center;">
            ${greeting}
          </h1>
          <p style="color:#64748b;font-size:15px;margin:0 0 22px;text-align:center;">
            Your <strong style="color:#dc2626;">${current_streak}-day streak</strong> ends at midnight if you don't take today's challenge.
          </p>

          <div style="text-align:center;margin:24px 0;">
            <a href="${challengeUrl}" style="display:inline-block;padding:12px 28px;background:#2563eb;color:#fff;text-decoration:none;font-weight:700;border-radius:9px;font-size:14px;">
              Take today's challenge →
            </a>
          </div>

          <p style="color:#94a3b8;font-size:12px;line-height:1.6;margin:24px 0 0;text-align:center;">
            One question. Takes 5 minutes.<br/>
            Streaks build the habit that lands the job.
          </p>
          <p style="color:#cbd5e1;font-size:11px;margin:14px 0 0;text-align:center;">— ${teamName}</p>
        </div>
      </div>
    `);
  }

  // ── User welcome (fired once on first OTP verification / account create) ───
  async sendUserWelcome(opts: { email: string; name?: string | null }) {
    const { email, name } = opts;
    const greeting = name ? `Hey ${name} 👋` : 'Hey there 👋';
    const subject = await this.getSetting('email_welcome_subject', '🎉 Welcome to TechChampsByRev');
    const teamName = await this.getSetting('email_team_name', 'TechChampsByRev Team');

    await this.send(email, subject, `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:12px;">
        <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
          <h1 style="color:#0f172a;font-size:22px;margin:0 0 8px;">${greeting}</h1>
          <p style="color:#64748b;font-size:15px;margin:0 0 24px;">
            Welcome aboard. Your TechChampsByRev account is live.
          </p>

          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:20px;margin-bottom:24px;">
            <p style="margin:0 0 10px;color:#1e40af;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;">
              Start with these
            </p>
            <ul style="margin:0;padding-left:20px;color:#475569;font-size:14px;line-height:1.8;">
              <li>Pick a roadmap that matches your target role</li>
              <li>Run your resume through the ATS checker</li>
              <li>Browse fresh jobs and bookmark the ones you like</li>
            </ul>
          </div>

          <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px;">
            Daily challenges, streaks, and Pro features land soon — you'll be among the first to use them.
          </p>
          <p style="color:#94a3b8;font-size:13px;margin:0;">— <strong>${teamName}</strong></p>
        </div>
      </div>
    `);
  }

  // ── OTP verification ───────────────────────────────────────────────────────
  async sendOtp(email: string, code: string) {
    await this.send(email, `${code} — Your TechChampsByRev verification code`, `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:12px;">
        <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #e2e8f0;text-align:center;">
          <h2 style="color:#0f172a;font-size:20px;margin:0 0 8px;">Verify your email</h2>
          <p style="color:#64748b;font-size:14px;margin:0 0 28px;">Enter this code on the order page. It expires in 10 minutes.</p>
          <div style="display:inline-block;background:#eff6ff;border:2px solid #bfdbfe;border-radius:12px;padding:20px 40px;margin-bottom:24px;">
            <span style="font-size:36px;font-weight:800;letter-spacing:12px;color:#1d4ed8;font-family:monospace;">${code}</span>
          </div>
          <p style="color:#94a3b8;font-size:12px;margin:0;">If you didn't request this, ignore this email.</p>
        </div>
      </div>
    `);
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
    const subject = await this.getSetting('email_booking_confirmed_subject', '✅ Your 1:1 Career Call is Confirmed!');
    const teamName = await this.getSetting('email_team_name', 'TechChampsByRev Team');

    await this.send(email, subject, `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:12px;">
        <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
          <h1 style="color:#0f172a;font-size:22px;margin:0 0 8px;">Hi ${name} 👋</h1>
          <p style="color:#64748b;font-size:15px;margin:0 0 24px;">Your 1:1 career call has been successfully booked!</p>

          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:20px;margin-bottom:24px;">
            <p style="margin:0 0 10px;color:#1e40af;font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;">Booking Details</p>
            <table style="width:100%;font-size:14px;border-collapse:collapse;">
              <tr><td style="color:#64748b;padding:4px 0;">Date</td><td style="color:#0f172a;font-weight:600;">${formattedDate}</td></tr>
              <tr><td style="color:#64748b;padding:4px 0;">Time</td><td style="color:#0f172a;font-weight:600;">${time} IST</td></tr>
              <tr><td style="color:#64748b;padding:4px 0;">Duration</td><td style="color:#0f172a;font-weight:600;">30 Minutes</td></tr>
            </table>
          </div>

          <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px;">
            We'll reach out to you with the meeting link before the session. Make sure to keep your resume and any questions ready!
          </p>

          <p style="color:#94a3b8;font-size:13px;margin:0;">
            Questions? Reply to this email or reach us on WhatsApp.<br/>
            — <strong>${teamName}</strong>
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
    const teamName = await this.getSetting('email_team_name', 'TechChampsByRev Team');

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
          <p style="color:#94a3b8;font-size:13px;margin:16px 0 0;">— <strong>${teamName}</strong></p>
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
    const subject = await this.getSetting('email_booking_cancelled_subject', '❌ Your 1:1 Call Has Been Cancelled');
    const teamName = await this.getSetting('email_team_name', 'TechChampsByRev Team');

    await this.send(email, subject, `
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
          <p style="color:#94a3b8;font-size:13px;margin:0;">— <strong>${teamName}</strong></p>
        </div>
      </div>
    `);
  }

  // ── Admin alert when a service order is paid ───────────────────────────────
  async sendAdminOrderAlert(opts: {
    name: string;
    email: string;
    service: string;
    order_id: string;
    amount: string;
  }) {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) return;
    const { name, email, service, order_id, amount } = opts;
    const teamName = await this.getSetting('email_team_name', 'TechChampsByRev Team');

    await this.send(adminEmail, `💰 New Order: ${name} — ${service}`, `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#f8fafc;border-radius:12px;">
        <div style="background:#fff;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
          <h2 style="color:#0f172a;font-size:18px;margin:0 0 16px;">💰 New Service Order Received</h2>
          <table style="width:100%;font-size:14px;border-collapse:collapse;">
            <tr><td style="color:#64748b;padding:6px 0;width:90px;">Name</td><td style="color:#0f172a;font-weight:600;">${name}</td></tr>
            <tr><td style="color:#64748b;padding:6px 0;">Email</td><td style="color:#0f172a;">${email}</td></tr>
            <tr><td style="color:#64748b;padding:6px 0;">Service</td><td style="color:#0f172a;font-weight:600;">${service}</td></tr>
            <tr><td style="color:#64748b;padding:6px 0;">Amount</td><td style="color:#059669;font-weight:700;">${amount}</td></tr>
            <tr><td style="color:#64748b;padding:6px 0;">Order ID</td><td style="color:#0f172a;font-family:monospace;font-size:12px;">${order_id}</td></tr>
          </table>
          <p style="color:#94a3b8;font-size:13px;margin:16px 0 0;">— <strong>${teamName}</strong></p>
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
    const subject = await this.getSetting('email_order_confirmed_subject', '🎉 Order Confirmed — TechChampsByRev');
    const teamName = await this.getSetting('email_team_name', 'TechChampsByRev Team');

    await this.send(email, subject, `
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
          <p style="color:#94a3b8;font-size:13px;margin:0;">— <strong>${teamName}</strong></p>
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
