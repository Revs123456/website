import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('blogs')
export class Blog {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() title: string;
  @Column({ default: 'General' }) category: string;
  @Column({ nullable: true }) author: string;
  @Column({ nullable: true }) read_time: string;
  @Column('text') summary: string;
  @Column('text') content: string;
  @Column({ nullable: true }) cover_image: string;
  @Column({ default: true }) published: boolean;
  @CreateDateColumn() created_at: Date;
}
