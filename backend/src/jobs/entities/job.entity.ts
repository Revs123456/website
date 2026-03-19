import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() title: string;
  @Column() company: string;
  @Column() location: string;
  @Column() experience: string;
  @Column({ default: 'Full-time' }) type: string;
  @Column({ default: 'Frontend' }) category: string;
  @Column({ nullable: true }) salary: string;
  @Column('text') description: string;
  @Column('text', { nullable: true }) requirements: string;
  @Column('text', { nullable: true }) benefits: string;
  @Column('text', { nullable: true }) tech_stack: string;
  @Column({ nullable: true }) apply_link: string;
  @CreateDateColumn() created_at: Date;
}
