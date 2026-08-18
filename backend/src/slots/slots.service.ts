import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class SlotsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  findAll() {
    return this.prisma.slot.findMany({ orderBy: [{ date: 'asc' }, { start_time: 'asc' }] });
  }

  findAvailable() {
    const today = new Date().toISOString().slice(0, 10);
    return this.prisma.slot.findMany({
      where: { is_booked: false, is_active: true, date: { gte: today } },
      orderBy: [{ date: 'asc' }, { start_time: 'asc' }],
    });
  }

  create(data: any) {
    return this.prisma.slot.create({ data });
  }

  async remove(id: string) {
    const slot = await this.prisma.slot.findUnique({ where: { id } });
    if (!slot) throw new NotFoundException('Slot not found');
    await this.prisma.slot.delete({ where: { id } });
    return { deleted: true };
  }

  async book(id: string, data: { name: string; email: string; order_id?: string }) {
    // Verify payment first (before attempting to claim the slot)
    if (!data.order_id) throw new BadRequestException('Order ID required to book a slot');
    const order = await this.prisma.order.findUnique({ where: { id: data.order_id } });
    if (!order) throw new BadRequestException('Order not found');
    if (order.payment_status !== 'paid') {
      throw new BadRequestException('Payment not verified. Complete payment before booking.');
    }
    // Prevent reuse: one payment = one slot booking
    if (order.status === 'slot_used') {
      throw new BadRequestException('This payment has already been used for a booking.');
    }

    // Atomic update: only succeeds if slot is currently NOT booked (prevents race condition)
    const result = await this.prisma.slot.updateMany({
      where: { id, is_booked: false },
      data: { is_booked: true, booked_name: data.name, booked_email: data.email, order_id: data.order_id },
    });

    if (!result.count) {
      // Either slot doesn't exist or was already booked by a concurrent request
      const slot = await this.prisma.slot.findUnique({ where: { id } });
      if (!slot) throw new NotFoundException('Slot not found');
      throw new BadRequestException('Slot already booked. Please choose another slot.');
    }

    // Mark order as consumed so it cannot be reused to book another slot
    await this.prisma.order.update({ where: { id: data.order_id }, data: { status: 'slot_used' } });

    const slot = await this.prisma.slot.findUnique({ where: { id } });

    // Send emails (non-blocking, errors logged but don't fail the request)
    const emailData = { name: data.name, email: data.email, date: slot!.date, start_time: slot!.start_time, end_time: slot!.end_time };
    Promise.all([
      this.mail.sendBookingConfirmation(emailData).catch(err => console.error('[MAIL] Booking confirmation failed:', err)),
      this.mail.sendAdminBookingAlert(emailData).catch(err => console.error('[MAIL] Admin booking alert failed:', err)),
    ]);

    return slot;
  }

  async unbook(id: string) {
    const slot = await this.prisma.slot.findUnique({ where: { id } });
    if (!slot) throw new NotFoundException('Slot not found');

    if (slot.is_booked && slot.booked_email) {
      this.mail.sendCancellationNotice({
        name: slot.booked_name || 'User',
        email: slot.booked_email,
        date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
      }).catch(err => console.error('[MAIL] Cancellation notice failed:', err));
    }

    await this.prisma.slot.update({
      where: { id },
      data: { is_booked: false, booked_name: null, booked_email: null, order_id: null },
    });
    return { released: true };
  }

  async update(id: string, data: any) {
    const slot = await this.prisma.slot.findUnique({ where: { id } });
    if (!slot) throw new NotFoundException('Slot not found');
    return this.prisma.slot.update({ where: { id }, data });
  }

  async toggleActive(id: string) {
    const slot = await this.prisma.slot.findUnique({ where: { id } });
    if (!slot) throw new NotFoundException('Slot not found');
    return this.prisma.slot.update({ where: { id }, data: { is_active: !slot.is_active } });
  }
}
