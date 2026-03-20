import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() title: string;
  @Column() platform: string;
  @Column({ default: 'Frontend' }) category: string;
  @Column() duration: string;
  @Column({ default: 'Beginner' }) level: string;
  @Column({ nullable: true }) instructor: string;
  @Column('float', { default: 4.5 }) rating: number;
  @Column({ nullable: true }) students: string;
  @Column({ nullable: true }) price: string;
  @Column('text', { nullable: true }) description: string;
  @Column('text', { nullable: true }) modules: string;
  @Column({ nullable: true }) course_link: string;
  @Column({ type: 'boolean', default: true }) published: boolean;
  @CreateDateColumn() created_at: Date;
}
