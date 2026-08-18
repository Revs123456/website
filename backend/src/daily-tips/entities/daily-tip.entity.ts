import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('daily_tips')
export class DailyTip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  tip: string;

  @Column({ default: 'Career' }) // Career, DSA, Resume, Interview, Frontend, Backend
  category: string;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  created_at: Date;
}
