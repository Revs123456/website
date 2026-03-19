import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('interview_questions')
export class InterviewQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  company: string;

  @Column()
  role: string;

  @Column('text')
  question: string;

  @Column('text', { nullable: true })
  answer: string;

  @Column({ default: 'Medium' }) // Easy, Medium, Hard
  difficulty: string;

  @Column({ default: 'DSA' }) // DSA, System Design, HR, Frontend, Backend
  category: string;

  @Column({ default: true })
  published: boolean;

  @CreateDateColumn()
  created_at: Date;
}
