import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  admin_email: string;

  @Column()
  method: string;

  @Column()
  path: string;

  @CreateDateColumn()
  created_at: Date;
}
