import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('slots')
export class Slot {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() date: string;           // e.g. "2026-04-05"
  @Column() start_time: string;     // e.g. "10:00"
  @Column() end_time: string;       // e.g. "10:30"
  @Column({ default: false }) is_booked: boolean;
  @Column({ default: true }) is_active: boolean;
  @Column({ nullable: true, type: 'varchar' }) booked_name: string | null;
  @Column({ nullable: true, type: 'varchar' }) booked_email: string | null;
  @Column({ nullable: true, type: 'varchar' }) order_id: string | null;
  @CreateDateColumn() created_at: Date;
}
