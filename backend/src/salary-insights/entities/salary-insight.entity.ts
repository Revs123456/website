import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('salary_insights')
export class SalaryInsight {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  role: string;

  @Column()
  city: string;

  @Column()
  experience_level: string; // Fresher, 1-3 yrs, 3-5 yrs, 5+ yrs

  @Column()
  min_salary: string; // e.g. "₹6 LPA"

  @Column()
  max_salary: string; // e.g. "₹12 LPA"

  @Column({ nullable: true })
  avg_salary: string;

  @Column({ nullable: true })
  companies: string; // comma separated

  @CreateDateColumn()
  created_at: Date;
}
