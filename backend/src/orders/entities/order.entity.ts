import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  customer_name: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  customer_email: string;

  @Column({ nullable: true })
  service_type: string;

  @Column({ nullable: true })
  service_id: string;

  @Column({ nullable: true })
  experience_level: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ nullable: true })
  resume_file: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ default: 'unpaid' })
  payment_status: string;

  @Column({ nullable: true })
  razorpay_order_id: string;

  @Column({ nullable: true })
  razorpay_payment_id: string;

  @Column({ nullable: true })
  amount: number;

  @CreateDateColumn()
  created_at: Date;
}
