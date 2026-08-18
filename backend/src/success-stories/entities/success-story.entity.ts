import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('success_stories')
export class SuccessStory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  before_role: string;

  @Column()
  after_role: string;

  @Column()
  company: string;

  @Column({ nullable: true })
  salary_hike: string; // e.g. "120% hike"

  @Column('text')
  story: string;

  @Column({ nullable: true })
  initials: string;

  @Column({ default: '#2563eb' })
  color: string;

  @Column({ default: '#eff6ff' })
  bg: string;

  @Column({ default: false })
  published: boolean;

  @CreateDateColumn()
  created_at: Date;
}
