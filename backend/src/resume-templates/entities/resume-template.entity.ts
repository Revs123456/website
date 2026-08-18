import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('resume_templates')
export class ResumeTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column({ default: 'Free' }) // Free or price like ₹99
  price: string;

  @Column({ nullable: true })
  download_link: string;

  @Column({ nullable: true })
  preview_image: string;

  @Column({ default: 'ATS-Friendly' }) // tag
  tag: string;

  @Column({ default: true })
  is_free: boolean;

  @Column({ default: true })
  published: boolean;

  @CreateDateColumn()
  created_at: Date;
}
