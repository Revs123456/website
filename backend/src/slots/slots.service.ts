import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Slot } from './entities/slot.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class SlotsService {
  constructor(
    @InjectRepository(Slot) private repo: Repository<Slot>,
    private mail: MailService,
  ) {}

  findAll() {
    return this.repo.find({ order: { date: 'ASC', start_time: 'ASC' } });
  }

  findAvailable() {
    const today = new Date().toISOString().slice(0, 10);
    return this.repo.find({
      where: { is_booked: false, is_active: true },
      order: { date: 'ASC', start_time: 'ASC' },
    }).then(slots => slots.filter(s => s.date >= today));
  }

  async create(data: Partial<Slot>) {
    const slot = this.repo.create(data);
    return this.repo.save(slot);
  }

  async remove(id: string) {
    const slot = await this.repo.findOne({ where: { id } });
    if (!slot) throw new NotFoundException('Slot not found');
    await this.repo.delete(id);
    return { deleted: true };
  }

  async book(id: string, data: { name: string; email: string; order_id?: string }) {
    const slot = await this.repo.findOne({ where: { id } });
    if (!slot) throw new NotFoundException('Slot not found');
    if (slot.is_booked) throw new BadRequestException('Slot already booked');
    await this.repo.update(id, {
      is_booked: true,
      booked_name: data.name,
      booked_email: data.email,
      order_id: data.order_id ?? null,
    });
    const updated = await this.repo.findOne({ where: { id } });

    // Send emails (non-blocking — don't await)
    this.mail.sendBookingConfirmation({
      name: data.name,
      email: data.email,
      date: slot.date,
      start_time: slot.start_time,
      end_time: slot.end_time,
    });
    this.mail.sendAdminBookingAlert({
      name: data.name,
      email: data.email,
      date: slot.date,
      start_time: slot.start_time,
      end_time: slot.end_time,
    });

    return updated;
  }

  async unbook(id: string) {
    const slot = await this.repo.findOne({ where: { id } });
    if (!slot) throw new NotFoundException('Slot not found');

    // Send cancellation if there was a booked user
    if (slot.is_booked && slot.booked_email) {
      this.mail.sendCancellationNotice({
        name: slot.booked_name || 'User',
        email: slot.booked_email,
        date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
      });
    }

    await this.repo.update(id, { is_booked: false, booked_name: null, booked_email: null, order_id: null });
    return { released: true };
  }

  async update(id: string, data: Partial<Slot>) {
    const slot = await this.repo.findOne({ where: { id } });
    if (!slot) throw new NotFoundException('Slot not found');
    await this.repo.update(id, data);
    return this.repo.findOne({ where: { id } });
  }

  async toggleActive(id: string) {
    const slot = await this.repo.findOne({ where: { id } });
    if (!slot) throw new NotFoundException('Slot not found');
    await this.repo.update(id, { is_active: !slot.is_active });
    return this.repo.findOne({ where: { id } });
  }
}
