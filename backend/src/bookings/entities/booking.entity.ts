import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column()
  experience: string; // Fresher, 1-3 yrs, 3-5 yrs, 5+ yrs

  @Column()
  role: string; // Frontend, Backend, Full-Stack, DevOps

  @Column({ nullable: true })
  preferred_date: string;

  @Column({ nullable: true })
  preferred_time: string;

  @Column('text', { nullable: true })
  notes: string;

  @Column({ default: 'Pending' }) // Pending, Confirmed, Completed, Cancelled
  status: string;

  @CreateDateColumn()
  created_at: Date;
}
