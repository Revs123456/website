import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('roadmaps')
export class Roadmap {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() title: string;
  @Column({ nullable: true }) description: string;
  @Column({ default: '#2563eb' }) color: string;
  @Column({ default: 'Globe' }) icon: string;
  @Column('jsonb', { nullable: true }) steps: { s: string; d: string }[];
  @Column({ default: true }) published: boolean;
  @CreateDateColumn() created_at: Date;
}
