import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('subscribers')
export class Subscriber {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  whatsapp: string;

  @Column({ default: 'both' }) // 'jobs', 'newsletter', 'both'
  type: string;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  created_at: Date;
}
