import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('testimonials')
export class Testimonial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  role: string; // e.g. "Frontend Dev @ Zomato"

  @Column('text')
  quote: string;

  @Column({ nullable: true })
  initials: string; // e.g. "RS"

  @Column({ default: '#2563eb' })
  color: string;

  @Column({ default: '#eff6ff' })
  bg: string;

  @Column({ nullable: true })
  package: string; // e.g. "ATS Resume"

  @Column({ default: 5 })
  rating: number;

  @Column({ default: true })
  published: boolean;

  @CreateDateColumn()
  created_at: Date;
}
