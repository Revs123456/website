import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  service_type: string;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ nullable: true })
  resume_file: string;

  @CreateDateColumn()
  created_at: Date;
}
