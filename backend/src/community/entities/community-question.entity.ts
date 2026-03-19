import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('community_questions')
export class CommunityQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  author_name: string;

  @Column()
  title: string;

  @Column('text')
  question: string;

  @Column('text', { nullable: true })
  answer: string;

  @Column({ nullable: true })
  answered_by: string;

  @Column({ nullable: true })
  tags: string; // comma separated

  @Column({ default: false })
  solved: boolean;

  @Column({ default: true })
  published: boolean;

  @CreateDateColumn()
  created_at: Date;
}
